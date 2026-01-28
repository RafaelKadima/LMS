import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getStats(currentUser: any) {
    const franchiseFilter = this.buildFranchiseFilter(currentUser);

    const [
      totalUsers,
      activeUsers,
      totalFranchises,
      totalStores,
      totalCourses,
      publishedCourses,
      totalEnrollments,
      completedEnrollments,
      totalBadges,
      totalBadgeAwards,
      recentEnrollments,
      topCourses,
      usersByRole,
      enrollmentsByStatus,
    ] = await Promise.all([
      // Users
      this.prisma.user.count({ where: franchiseFilter }),
      this.prisma.user.count({ where: { ...franchiseFilter, isActive: true } }),

      // Franchises (super_admin only)
      currentUser.role === 'super_admin'
        ? this.prisma.franchise.count()
        : 1,

      // Stores
      this.prisma.store.count({
        where: franchiseFilter.franchiseId
          ? { franchiseId: franchiseFilter.franchiseId }
          : {},
      }),

      // Courses
      this.prisma.course.count({
        where: franchiseFilter.franchiseId
          ? { OR: [{ franchiseId: franchiseFilter.franchiseId }, { franchiseId: null }] }
          : {},
      }),
      this.prisma.course.count({
        where: {
          status: 'published',
          ...(franchiseFilter.franchiseId
            ? { OR: [{ franchiseId: franchiseFilter.franchiseId }, { franchiseId: null }] }
            : {}),
        },
      }),

      // Enrollments
      this.prisma.enrollment.count({
        where: {
          user: franchiseFilter,
        },
      }),
      this.prisma.enrollment.count({
        where: {
          user: franchiseFilter,
          status: 'completed',
        },
      }),

      // Badges
      this.prisma.badge.count(),
      this.prisma.badgeAward.count({
        where: {
          user: franchiseFilter,
        },
      }),

      // Recent enrollments
      this.prisma.enrollment.findMany({
        where: {
          user: franchiseFilter,
        },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          course: {
            select: { id: true, title: true, thumbnailUrl: true },
          },
        },
      }),

      // Top courses by enrollment
      this.prisma.course.findMany({
        where: franchiseFilter.franchiseId
          ? { OR: [{ franchiseId: franchiseFilter.franchiseId }, { franchiseId: null }] }
          : {},
        take: 5,
        include: {
          _count: {
            select: { enrollments: true },
          },
        },
        orderBy: {
          enrollments: {
            _count: 'desc',
          },
        },
      }),

      // Users by role
      this.prisma.user.groupBy({
        by: ['role'],
        where: franchiseFilter,
        _count: true,
      }),

      // Enrollments by status
      this.prisma.enrollment.groupBy({
        by: ['status'],
        where: {
          user: franchiseFilter,
        },
        _count: true,
      }),
    ]);

    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

    return {
      overview: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalFranchises,
        totalStores,
        totalCourses,
        publishedCourses,
        draftCourses: totalCourses - publishedCourses,
        totalEnrollments,
        completedEnrollments,
        completionRate,
        totalBadges,
        totalBadgeAwards,
      },
      charts: {
        usersByRole: usersByRole.map((r) => ({
          role: r.role,
          count: r._count,
        })),
        enrollmentsByStatus: enrollmentsByStatus.map((e) => ({
          status: e.status,
          count: e._count,
        })),
      },
      recentEnrollments: recentEnrollments.map((e) => ({
        id: e.id,
        user: e.user,
        course: e.course,
        status: e.status,
        progress: e.progress,
        startedAt: e.startedAt,
      })),
      topCourses: topCourses.map((c) => ({
        id: c.id,
        title: c.title,
        thumbnailUrl: c.thumbnailUrl,
        enrollmentsCount: c._count.enrollments,
      })),
    };
  }

  private buildFranchiseFilter(currentUser: any) {
    if (currentUser.role === 'franchise_admin') {
      return { franchiseId: currentUser.franchiseId };
    }
    if (currentUser.role === 'store_manager') {
      return { storeId: currentUser.storeId };
    }
    return {};
  }
}
