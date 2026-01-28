import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TracksService {
  constructor(private prisma: PrismaService) {}

  async getAll(user: any) {
    const { franchiseId, cargo } = user;

    const tracks = await this.prisma.track.findMany({
      where: {
        OR: [{ franchiseId: null }, { franchiseId }],
        AND: [
          {
            OR: [
              { targetCargos: { has: cargo } },
              { targetCargos: { isEmpty: true } }, // Trilhas para todos os cargos
            ],
          },
        ],
      },
      include: {
        items: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                durationMinutes: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return tracks.map((track) => ({
      id: track.id,
      title: track.title,
      description: track.description,
      thumbnailUrl: track.thumbnailUrl,
      isRequired: track.isRequired,
      coursesCount: track.items.length,
      courses: track.items.map((item) => item.course),
    }));
  }

  async getById(id: string, userId: string) {
    const track = await this.prisma.track.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            course: {
              include: {
                enrollments: {
                  where: { userId },
                  select: { progress: true, status: true },
                },
                modules: {
                  include: {
                    lessons: { select: { id: true } },
                  },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!track) {
      throw new NotFoundException('Trilha não encontrada');
    }

    const courses = track.items.map((item) => ({
      id: item.course.id,
      title: item.course.title,
      thumbnailUrl: item.course.thumbnailUrl,
      durationMinutes: item.course.durationMinutes,
      lessonsCount: item.course.modules.reduce((acc, m) => acc + m.lessons.length, 0),
      progress: item.course.enrollments[0]?.progress || 0,
      completed: item.course.enrollments[0]?.status === 'completed',
    }));

    const completedCourses = courses.filter((c) => c.completed).length;
    const overallProgress = Math.round((completedCourses / courses.length) * 100);

    return {
      id: track.id,
      title: track.title,
      description: track.description,
      thumbnailUrl: track.thumbnailUrl,
      isRequired: track.isRequired,
      overallProgress,
      completedCourses,
      totalCourses: courses.length,
      courses,
    };
  }

  async enrollInTrack(trackId: string, userId: string) {
    const track = await this.prisma.track.findUnique({
      where: { id: trackId },
      include: {
        items: {
          select: { courseId: true },
        },
      },
    });

    if (!track) {
      throw new NotFoundException('Trilha não encontrada');
    }

    // Enroll user in all courses of the track
    const enrollments = await Promise.all(
      track.items.map((item) =>
        this.prisma.enrollment.upsert({
          where: {
            userId_courseId: {
              userId,
              courseId: item.courseId,
            },
          },
          create: {
            userId,
            courseId: item.courseId,
            status: 'active',
          },
          update: {},
        })
      )
    );

    return {
      enrolled: true,
      trackId,
      coursesEnrolled: enrollments.length,
    };
  }
}
