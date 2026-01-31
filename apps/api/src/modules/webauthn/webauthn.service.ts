import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class WebAuthnService implements OnModuleInit {
  private challenges = new Map<
    string,
    { challenge: string; expiresAt: number }
  >();
  private rpName: string;
  private rpID: string;
  private origin: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.rpName =
      this.configService.get('WEBAUTHN_RP_NAME') || 'Universidade MotoChefe';
    this.rpID = this.configService.get('WEBAUTHN_RP_ID') || 'localhost';
    this.origin =
      this.configService.get('WEBAUTHN_ORIGIN') || 'http://localhost:3000';
  }

  onModuleInit() {
    setInterval(() => this.cleanupChallenges(), 10 * 60 * 1000);
  }

  // --- Registration ---

  async generateRegistrationOptions(userId: string) {
    const {
      generateRegistrationOptions,
    } = await import('@simplewebauthn/server');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('Usuario nao encontrado');

    const existingCredentials = await this.prisma.webAuthnCredential.findMany({
      where: { userId },
    });

    const options = await generateRegistrationOptions({
      rpName: this.rpName,
      rpID: this.rpID,
      userName: user.email,
      userDisplayName: user.name,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      excludeCredentials: existingCredentials.map((cred) => ({
        id: cred.credentialId,
        transports: cred.transports as any[],
      })),
    });

    this.storeChallenge(`reg:${userId}`, options.challenge);
    return options;
  }

  async verifyRegistration(
    userId: string,
    response: any,
    deviceName?: string,
  ) {
    const {
      verifyRegistrationResponse,
    } = await import('@simplewebauthn/server');

    const challenge = this.getAndDeleteChallenge(`reg:${userId}`);
    if (!challenge) {
      throw new BadRequestException('Challenge expirado ou invalido');
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      throw new BadRequestException('Falha na verificacao do registro');
    }

    const { credential } = verification.registrationInfo;

    const created = await this.prisma.webAuthnCredential.create({
      data: {
        userId,
        credentialId: credential.id,
        credentialPublicKey: Buffer.from(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports || [],
        deviceName: deviceName || null,
      },
    });

    return {
      id: created.id,
      deviceName: created.deviceName,
      createdAt: created.createdAt,
    };
  }

  // --- Authentication ---

  async generateAuthenticationOptions(email?: string) {
    const {
      generateAuthenticationOptions,
    } = await import('@simplewebauthn/server');

    let allowCredentials: { id: string; transports?: any[] }[] | undefined;

    if (email) {
      const user = await this.prisma.user.findUnique({
        where: { email },
        include: { webauthnCredentials: true },
      });

      if (user?.webauthnCredentials?.length) {
        allowCredentials = user.webauthnCredentials.map((cred) => ({
          id: cred.credentialId,
          transports: cred.transports as any[],
        }));
      }
    }

    const options = await generateAuthenticationOptions({
      rpID: this.rpID,
      allowCredentials,
      userVerification: 'preferred',
    });

    const sessionId = randomUUID();
    this.storeChallenge(`auth:${sessionId}`, options.challenge);

    return { options, sessionId };
  }

  async verifyAuthentication(sessionId: string, response: any) {
    const {
      verifyAuthenticationResponse,
    } = await import('@simplewebauthn/server');

    const challenge = this.getAndDeleteChallenge(`auth:${sessionId}`);
    if (!challenge) {
      throw new BadRequestException('Challenge expirado ou invalido');
    }

    const credential = await this.prisma.webAuthnCredential.findUnique({
      where: { credentialId: response.id },
      include: { user: true },
    });

    if (!credential) {
      throw new UnauthorizedException('Credencial nao encontrada');
    }

    if (!credential.user.isActive) {
      throw new UnauthorizedException('Usuario desativado');
    }

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challenge,
      expectedOrigin: this.origin,
      expectedRPID: this.rpID,
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(credential.credentialPublicKey),
        counter: Number(credential.counter),
        transports: credential.transports as any[],
      },
    });

    if (!verification.verified) {
      throw new UnauthorizedException('Falha na autenticacao');
    }

    await this.prisma.webAuthnCredential.update({
      where: { id: credential.id },
      data: {
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      },
    });

    return { userId: credential.userId };
  }

  // --- Management ---

  async listCredentials(userId: string) {
    const credentials = await this.prisma.webAuthnCredential.findMany({
      where: { userId },
      select: {
        id: true,
        deviceName: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return credentials;
  }

  async deleteCredential(userId: string, credentialDbId: string) {
    const credential = await this.prisma.webAuthnCredential.findFirst({
      where: { id: credentialDbId, userId },
    });

    if (!credential) {
      throw new BadRequestException('Credencial nao encontrada');
    }

    await this.prisma.webAuthnCredential.delete({
      where: { id: credentialDbId },
    });

    return { success: true };
  }

  async renameCredential(
    userId: string,
    credentialDbId: string,
    deviceName: string,
  ) {
    const credential = await this.prisma.webAuthnCredential.findFirst({
      where: { id: credentialDbId, userId },
    });

    if (!credential) {
      throw new BadRequestException('Credencial nao encontrada');
    }

    const updated = await this.prisma.webAuthnCredential.update({
      where: { id: credentialDbId },
      data: { deviceName },
      select: {
        id: true,
        deviceName: true,
        createdAt: true,
        lastUsedAt: true,
      },
    });

    return updated;
  }

  // --- Challenge helpers ---

  private storeChallenge(key: string, challenge: string) {
    this.challenges.set(key, {
      challenge,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
  }

  private getAndDeleteChallenge(key: string): string | null {
    const entry = this.challenges.get(key);
    if (!entry) return null;
    this.challenges.delete(key);
    if (entry.expiresAt < Date.now()) return null;
    return entry.challenge;
  }

  private cleanupChallenges() {
    const now = Date.now();
    for (const [key, entry] of this.challenges) {
      if (entry.expiresAt < now) {
        this.challenges.delete(key);
      }
    }
  }
}
