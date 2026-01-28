import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';

interface BadgesFilters {
  page?: number;
  perPage?: number;
  search?: string;
}

@Injectable()
export class BadgesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: BadgesFilters) {
    const page = Number(filters.page) || 1;
    const perPage = Number(filters.perPage) || 20;
    const search = filters.search;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [badges, total] = await Promise.all([
      this.prisma.badge.findMany({
        where,
        include: {
          _count: {
            select: { awards: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.badge.count({ where }),
    ]);

    return {
      data: badges.map((badge) => ({
        ...badge,
        awardsCount: badge._count.awards,
        _count: undefined,
      })),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async findOne(id: string) {
    const badge = await this.prisma.badge.findUnique({
      where: { id },
      include: {
        _count: {
          select: { awards: true },
        },
        awards: {
          take: 10,
          orderBy: { awardedAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!badge) {
      throw new NotFoundException(`Badge com ID ${id} não encontrado`);
    }

    return {
      ...badge,
      awardsCount: badge._count.awards,
      _count: undefined,
    };
  }

  async create(dto: CreateBadgeDto) {
    return this.prisma.badge.create({
      data: {
        name: dto.name,
        description: dto.description,
        imageUrl: dto.imageUrl || '',
        points: dto.points,
        criteriaJson: dto.criteriaJson || {},
      },
    });
  }

  async update(id: string, dto: UpdateBadgeDto) {
    // Verify badge exists
    await this.findOne(id);

    return this.prisma.badge.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.points !== undefined && { points: dto.points }),
        ...(dto.criteriaJson && { criteriaJson: dto.criteriaJson }),
      },
    });
  }

  async remove(id: string) {
    // Verify badge exists
    await this.findOne(id);

    await this.prisma.badge.delete({
      where: { id },
    });

    return { deleted: true };
  }

  async getStats() {
    const [totalBadges, totalAwards, topBadges] = await Promise.all([
      this.prisma.badge.count(),
      this.prisma.badgeAward.count(),
      this.prisma.badge.findMany({
        take: 5,
        include: {
          _count: {
            select: { awards: true },
          },
        },
        orderBy: {
          awards: {
            _count: 'desc',
          },
        },
      }),
    ]);

    return {
      totalBadges,
      totalAwards,
      topBadges: topBadges.map((b) => ({
        id: b.id,
        name: b.name,
        imageUrl: b.imageUrl,
        awardsCount: b._count.awards,
      })),
    };
  }

  async awardBadge(badgeId: string, userId: string) {
    // Check if user already has this badge
    const existingAward = await this.prisma.badgeAward.findUnique({
      where: {
        userId_badgeId: {
          userId,
          badgeId,
        },
      },
    });

    if (existingAward) {
      return existingAward;
    }

    return this.prisma.badgeAward.create({
      data: {
        userId,
        badgeId,
      },
      include: {
        badge: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async revokeBadge(badgeId: string, userId: string) {
    await this.prisma.badgeAward.delete({
      where: {
        userId_badgeId: {
          userId,
          badgeId,
        },
      },
    });

    return { revoked: true };
  }
}
