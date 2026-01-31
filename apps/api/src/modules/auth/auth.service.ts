import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou senha invalidos');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desativado');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou senha invalidos');
    }

    return this.generateTokenForUser(user.id);
  }

  async generateTokenForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        franchise: true,
        store: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desativado');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      franchiseId: user.franchiseId,
      storeId: user.storeId,
      cargo: user.cargo,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'motochefe-secret-dev',
      expiresIn: '8h',
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      franchiseId: user.franchiseId,
      storeId: user.storeId,
      cargo: user.cargo,
      role: user.role,
      accessToken,
      franchise: user.franchise
        ? {
            id: user.franchise.id,
            name: user.franchise.name,
          }
        : null,
      store: user.store
        ? {
            id: user.store.id,
            name: user.store.name,
          }
        : null,
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        franchise: true,
        store: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      cargo: user.cargo,
      role: user.role,
      avatarUrl: user.avatarUrl,
      franchise: user.franchise
        ? {
            id: user.franchise.id,
            name: user.franchise.name,
          }
        : null,
      store: user.store
        ? {
            id: user.store.id,
            name: user.store.name,
          }
        : null,
    };
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'motochefe-secret-dev',
      });
      return payload;
    } catch {
      throw new UnauthorizedException('Token invalido');
    }
  }

  async getUserBadges(userId: string) {
    // Buscar badges que o usuário ganhou
    const awards = await this.prisma.badgeAward.findMany({
      where: { userId },
      include: {
        badge: true,
      },
      orderBy: { awardedAt: 'desc' },
    });

    // Buscar todas as badges disponíveis
    const allBadges = await this.prisma.badge.findMany({
      orderBy: { name: 'asc' },
    });

    // Mapear badges ganhas
    const earnedBadgeIds = new Set(awards.map((a) => a.badgeId));

    return {
      earned: awards.map((award) => ({
        id: award.badge.id,
        name: award.badge.name,
        description: award.badge.description,
        iconUrl: award.badge.imageUrl,
        awardedAt: award.awardedAt,
      })),
      available: allBadges
        .filter((b) => !earnedBadgeIds.has(b.id))
        .map((badge) => ({
          id: badge.id,
          name: badge.name,
          description: badge.description,
          iconUrl: badge.imageUrl,
        })),
      totalEarned: awards.length,
      totalAvailable: allBadges.length,
    };
  }
}
