import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async getUserEnrollments(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            durationMinutes: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return enrollments.map((e) => ({
      id: e.id,
      courseId: e.courseId,
      course: e.course,
      status: e.status,
      progress: e.progress,
      startedAt: e.startedAt,
      completedAt: e.completedAt,
    }));
  }

  async enroll(userId: string, courseId: string) {
    // Check if course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new BadRequestException('Curso não encontrado');
    }

    // Create or return existing enrollment
    const enrollment = await this.prisma.enrollment.upsert({
      where: {
        userId_courseId: { userId, courseId },
      },
      create: {
        userId,
        courseId,
        status: 'active',
      },
      update: {},
    });

    return {
      enrolled: true,
      enrollmentId: enrollment.id,
      courseId,
    };
  }
}
