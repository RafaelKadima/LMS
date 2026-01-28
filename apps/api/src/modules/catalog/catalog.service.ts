import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CatalogFilters {
  search?: string;
  category?: string;
  page?: number;
  perPage?: number;
}

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async getCatalog(user: any, filters: CatalogFilters) {
    const { franchiseId, cargo, sub: userId } = user;
    const { search } = filters;
    const page = Number(filters.page) || 1;
    const perPage = Number(filters.perPage) || 20;

    const where: any = {
      status: 'published',
      OR: [
        { franchiseId: null }, // Global courses
        { franchiseId }, // Franchise-specific
      ],
      // Cursos que incluem o cargo do usuário OU não têm restrição de cargo (array vazio)
      AND: [
        {
          OR: [
            { targetCargos: { has: cargo } },
            { targetCargos: { isEmpty: true } }, // Cursos para todos os cargos (array vazio)
          ],
        },
      ],
    };

    if (search) {
      // Adicionar busca ao array AND existente
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: {
          modules: {
            include: {
              lessons: {
                select: { id: true },
              },
            },
          },
          enrollments: {
            where: { userId },
            select: { progress: true, status: true },
          },
        },
        orderBy: { order: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.course.count({ where }),
    ]);

    const data = courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      durationMinutes: course.durationMinutes,
      lessonsCount: course.modules.reduce((acc, m) => acc + m.lessons.length, 0),
      isRequired: course.isRequired,
      targetCargos: course.targetCargos,
      progress: course.enrollments[0]?.progress || 0,
      status: course.enrollments[0]?.status || null,
    }));

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getContinueWatching(userId: string) {
    const progress = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        completedAt: null,
        percentComplete: { gt: 0, lt: 100 },
      },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    return progress.map((p) => ({
      lessonId: p.lessonId,
      lessonTitle: p.lesson.title,
      courseId: p.lesson.module.course.id,
      courseTitle: p.lesson.module.course.title,
      thumbnailUrl: p.lesson.thumbnailUrl,
      lastPosition: p.lastPositionSeconds,
      duration: p.lesson.durationSeconds,
      percentComplete: p.percentComplete,
      updatedAt: p.updatedAt,
    }));
  }

  async getRequired(user: any) {
    const { franchiseId, cargo, sub: userId } = user;

    const courses = await this.prisma.course.findMany({
      where: {
        status: 'published',
        isRequired: true,
        OR: [{ franchiseId: null }, { franchiseId }],
        AND: [
          {
            OR: [
              { targetCargos: { has: cargo } },
              { targetCargos: { isEmpty: true } }, // Cursos para todos os cargos
            ],
          },
        ],
      },
      include: {
        modules: {
          include: {
            lessons: { select: { id: true } },
          },
        },
        enrollments: {
          where: { userId },
          select: { progress: true, status: true, completedAt: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      durationMinutes: course.durationMinutes,
      lessonsCount: course.modules.reduce((acc, m) => acc + m.lessons.length, 0),
      progress: course.enrollments[0]?.progress || 0,
      completed: course.enrollments[0]?.status === 'completed',
      completedAt: course.enrollments[0]?.completedAt,
    }));
  }

  async getRecommended(user: any) {
    const { franchiseId, cargo, sub: userId } = user;

    // Get courses user hasn't started yet
    const courses = await this.prisma.course.findMany({
      where: {
        status: 'published',
        isRequired: false,
        OR: [{ franchiseId: null }, { franchiseId }],
        AND: [
          {
            OR: [
              { targetCargos: { has: cargo } },
              { targetCargos: { isEmpty: true } }, // Cursos para todos os cargos
            ],
          },
        ],
        enrollments: {
          none: { userId },
        },
      },
      include: {
        modules: {
          include: {
            lessons: { select: { id: true } },
          },
        },
      },
      orderBy: { order: 'asc' },
      take: 10,
    });

    return courses.map((course) => ({
      id: course.id,
      title: course.title,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      durationMinutes: course.durationMinutes,
      lessonsCount: course.modules.reduce((acc, m) => acc + m.lessons.length, 0),
    }));
  }
}
