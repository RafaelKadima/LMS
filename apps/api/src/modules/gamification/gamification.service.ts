import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Tipos de critérios suportados
export enum BadgeCriteriaType {
  COURSES_COMPLETED = 'courses_completed', // Completar X cursos
  SPECIFIC_COURSE = 'specific_course', // Completar curso específico
  LESSONS_WATCHED = 'lessons_watched', // Assistir X aulas
  ENROLLMENT_STREAK = 'enrollment_streak', // Dias consecutivos estudando
  FIRST_COURSE = 'first_course', // Primeiro curso completado
  ALL_REQUIRED = 'all_required', // Todos cursos obrigatórios
}

export interface BadgeCriteria {
  type: BadgeCriteriaType;
  value?: number; // Para critérios numéricos (ex: 5 cursos)
  courseId?: string; // Para curso específico
}

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verifica e concede badges quando um curso é completado
   */
  async onCourseCompleted(userId: string, courseId: string) {
    const badges = await this.prisma.badge.findMany();
    const userStats = await this.getUserStats(userId);

    for (const badge of badges) {
      const criteria = badge.criteriaJson as unknown as BadgeCriteria | null;
      if (!criteria || !criteria.type) continue;

      const shouldAward = await this.checkCriteria(criteria, userId, courseId, userStats);

      if (shouldAward) {
        await this.awardBadgeIfNotExists(userId, badge.id);
      }
    }
  }

  /**
   * Verifica se um critério foi atingido
   */
  private async checkCriteria(
    criteria: BadgeCriteria,
    userId: string,
    completedCourseId: string,
    userStats: UserStats,
  ): Promise<boolean> {
    switch (criteria.type) {
      case BadgeCriteriaType.COURSES_COMPLETED:
        return userStats.completedCourses >= (criteria.value || 1);

      case BadgeCriteriaType.SPECIFIC_COURSE:
        return criteria.courseId === completedCourseId;

      case BadgeCriteriaType.LESSONS_WATCHED:
        return userStats.watchedLessons >= (criteria.value || 1);

      case BadgeCriteriaType.FIRST_COURSE:
        return userStats.completedCourses === 1;

      case BadgeCriteriaType.ALL_REQUIRED:
        return await this.checkAllRequiredCompleted(userId);

      default:
        return false;
    }
  }

  /**
   * Obtém estatísticas do usuário para verificação de critérios
   */
  private async getUserStats(userId: string): Promise<UserStats> {
    const [completedEnrollments, watchedLessons] = await Promise.all([
      this.prisma.enrollment.count({
        where: {
          userId,
          status: 'completed',
        },
      }),
      this.prisma.lessonProgress.count({
        where: {
          userId,
          completedAt: { not: null },
        },
      }),
    ]);

    return {
      completedCourses: completedEnrollments,
      watchedLessons,
    };
  }

  /**
   * Verifica se todos os cursos obrigatórios foram completados
   */
  private async checkAllRequiredCompleted(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { franchiseId: true },
    });

    // Busca cursos obrigatórios (globais + da franquia)
    const requiredCourses = await this.prisma.course.findMany({
      where: {
        isRequired: true,
        status: 'published',
        OR: [
          { franchiseId: null },
          { franchiseId: user?.franchiseId },
        ],
      },
      select: { id: true },
    });

    if (requiredCourses.length === 0) return false;

    // Verifica se o usuário completou todos
    const completedRequired = await this.prisma.enrollment.count({
      where: {
        userId,
        status: 'completed',
        courseId: {
          in: requiredCourses.map((c) => c.id),
        },
      },
    });

    return completedRequired >= requiredCourses.length;
  }

  /**
   * Concede badge se o usuário ainda não tiver
   */
  private async awardBadgeIfNotExists(userId: string, badgeId: string) {
    const existing = await this.prisma.badgeAward.findUnique({
      where: {
        userId_badgeId: { userId, badgeId },
      },
    });

    if (!existing) {
      await this.prisma.badgeAward.create({
        data: { userId, badgeId },
      });
      console.log(`Badge ${badgeId} concedido ao usuário ${userId}`);
    }
  }

  /**
   * Verifica todos os badges para um usuário (útil para verificação manual)
   */
  async checkAllBadgesForUser(userId: string) {
    const badges = await this.prisma.badge.findMany();
    const userStats = await this.getUserStats(userId);
    const awarded: string[] = [];

    for (const badge of badges) {
      const criteria = badge.criteriaJson as unknown as BadgeCriteria | null;
      if (!criteria || !criteria.type) continue;

      const shouldAward = await this.checkCriteria(criteria, userId, '', userStats);

      if (shouldAward) {
        await this.awardBadgeIfNotExists(userId, badge.id);
        awarded.push(badge.name);
      }
    }

    return { checkedBadges: badges.length, awarded };
  }
}

interface UserStats {
  completedCourses: number;
  watchedLessons: number;
}
