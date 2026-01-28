import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'motochefe-secret-dev',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario nao encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desativado');
    }

    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      franchiseId: payload.franchiseId,
      storeId: payload.storeId,
      cargo: payload.cargo,
      role: payload.role,
    };
  }
}
