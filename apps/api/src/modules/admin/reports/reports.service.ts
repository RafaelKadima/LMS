import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface ProgressReportFilters {
  page?: number;
  perPage?: number;
  search?: string;
  courseId?: string;
  status?: 'active' | 'completed';
  franchiseId?: string;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getProgressReport(currentUser: any, filters: ProgressReportFilters) {
    const page = Number(filters.page) || 1;
    const perPage = Number(filters.perPage) || 20;
    const { search, courseId, status, franchiseId } = filters;

    // Build where clause respeitando roles
    const where: any = {};

    // Filtro por role do usuário
    if (currentUser.role === 'franchise_admin') {
      where.franchiseId = currentUser.franchiseId;
    } else if (currentUser.role === 'store_manager') {
      where.storeId = currentUser.storeId;
    }
    // super_admin vê todos

    // Filtro por franquia (para super_admin)
    if (franchiseId && currentUser.role === 'super_admin') {
      where.franchiseId = franchiseId;
    }

    // Filtro por busca
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro por curso - buscar usuários que têm enrollment nesse curso
    if (courseId) {
      where.enrollments = {
        some: { courseId },
      };
    }

    // Filtro por status
    if (status) {
      where.enrollments = {
        ...where.enrollments,
        some: {
          ...where.enrollments?.some,
          status,
        },
      };
    }

    // Buscar usuários com enrollments
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          franchise: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
          enrollments: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                  modules: {
                    include: {
                      lessons: { select: { id: true } },
                    },
                  },
                },
              },
            },
          },
          lessonProgress: {
            select: {
              lessonId: true,
              secondsWatched: true,
              completedAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Processar dados
    const data = users.map((user) => {
      const enrollments = user.enrollments.map((enrollment) => {
        const totalLessons = enrollment.course.modules.reduce(
          (acc, m) => acc + m.lessons.length,
          0,
        );
        const lessonIds = enrollment.course.modules.flatMap((m) =>
          m.lessons.map((l) => l.id),
        );
        const completedLessons = user.lessonProgress.filter(
          (p) => lessonIds.includes(p.lessonId) && p.completedAt,
        ).length;

        return {
          courseId: enrollment.course.id,
          courseTitle: enrollment.course.title,
          status: enrollment.status,
          progress: enrollment.progress,
          completedLessons,
          totalLessons,
          startedAt: enrollment.startedAt,
          completedAt: enrollment.completedAt,
        };
      });

      const coursesCompleted = enrollments.filter(
        (e) => e.status === 'completed',
      ).length;
      const overallProgress =
        enrollments.length > 0
          ? Math.round(
              enrollments.reduce((acc, e) => acc + e.progress, 0) /
                enrollments.length,
            )
          : 0;
      const totalSecondsWatched = user.lessonProgress.reduce(
        (acc, p) => acc + p.secondsWatched,
        0,
      );
      const totalLessonsWatched = user.lessonProgress.filter(
        (p) => p.completedAt,
      ).length;

      // Última atividade
      const lastActivity = user.lessonProgress.reduce((latest, p) => {
        if (!latest || (p.updatedAt && p.updatedAt > latest)) {
          return p.updatedAt;
        }
        return latest;
      }, null as Date | null);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          cargo: user.cargo,
          franchise: user.franchise,
          store: user.store,
        },
        coursesEnrolled: enrollments.length,
        coursesCompleted,
        overallProgress,
        totalLessonsWatched,
        totalSecondsWatched,
        lastActivityAt: lastActivity,
        enrollments,
      };
    });

    // Summary
    const allEnrollments = await this.prisma.enrollment.findMany({
      where: where.franchiseId
        ? { user: { franchiseId: where.franchiseId } }
        : {},
    });
    const completedEnrollments = allEnrollments.filter(
      (e) => e.status === 'completed',
    );
    const avgProgress =
      allEnrollments.length > 0
        ? Math.round(
            allEnrollments.reduce((acc, e) => acc + e.progress, 0) /
              allEnrollments.length,
          )
        : 0;

    return {
      data,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
      summary: {
        totalUsers: total,
        averageProgress: avgProgress,
        completionRate:
          allEnrollments.length > 0
            ? Math.round(
                (completedEnrollments.length / allEnrollments.length) * 100,
              )
            : 0,
      },
    };
  }

  async getUserDetailedProgress(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        franchise: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        enrollments: {
          include: {
            course: {
              include: {
                modules: {
                  include: {
                    lessons: {
                      select: {
                        id: true,
                        title: true,
                        durationSeconds: true,
                      },
                    },
                  },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
        lessonProgress: true,
        badgeAwards: {
          include: {
            badge: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    const progressMap = new Map(
      user.lessonProgress.map((p) => [p.lessonId, p]),
    );

    const courses = user.enrollments.map((enrollment) => {
      const modules = enrollment.course.modules.map((module) => {
        const lessons = module.lessons.map((lesson) => {
          const progress = progressMap.get(lesson.id);
          return {
            id: lesson.id,
            title: lesson.title,
            durationSeconds: lesson.durationSeconds,
            percentComplete: progress?.percentComplete || 0,
            secondsWatched: progress?.secondsWatched || 0,
            completed: !!progress?.completedAt,
            completedAt: progress?.completedAt,
          };
        });

        return {
          id: module.id,
          title: module.title,
          lessons,
          completedLessons: lessons.filter((l) => l.completed).length,
          totalLessons: lessons.length,
        };
      });

      return {
        id: enrollment.course.id,
        title: enrollment.course.title,
        status: enrollment.status,
        progress: enrollment.progress,
        startedAt: enrollment.startedAt,
        completedAt: enrollment.completedAt,
        modules,
      };
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        cargo: user.cargo,
        franchise: user.franchise,
        store: user.store,
      },
      courses,
      badges: user.badgeAwards.map((award) => ({
        id: award.badge.id,
        name: award.badge.name,
        iconUrl: award.badge.imageUrl,
        awardedAt: award.awardedAt,
      })),
    };
  }
}
