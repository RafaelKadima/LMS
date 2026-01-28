import { Injectable, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { HeartbeatDto, CompleteDto } from './dto';

const CONFIG = {
  MAX_PLAYBACK_RATE: 2,
  HEARTBEAT_INTERVAL_MS: 5000,
  COMPLETION_THRESHOLD: 90,
};

@Injectable()
export class ProgressService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => GamificationService))
    private gamificationService: GamificationService,
  ) {}

  async updateProgress(userId: string, dto: HeartbeatDto) {
    const { lessonId, currentTime, duration, playbackRate, event } = dto;

    // Validate playback rate (no fast-forward abuse)
    if (playbackRate > CONFIG.MAX_PLAYBACK_RATE) {
      throw new BadRequestException(`Velocidade máxima de reprodução é ${CONFIG.MAX_PLAYBACK_RATE}x`);
    }

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new BadRequestException('Aula não encontrada');
    }

    // Calculate percent
    const percentComplete = Math.min(100, Math.round((currentTime / duration) * 100));

    // Upsert progress
    const progress = await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      update: {
        lastPositionSeconds: Math.floor(currentTime),
        secondsWatched: {
          increment: event === 'playing' ? Math.round(CONFIG.HEARTBEAT_INTERVAL_MS / 1000) : 0,
        },
        percentComplete: Math.max(percentComplete, 0), // Keep highest
      },
      create: {
        userId,
        lessonId,
        lastPositionSeconds: Math.floor(currentTime),
        secondsWatched: 0,
        percentComplete,
      },
    });

    return {
      lessonId,
      lastPosition: progress.lastPositionSeconds,
      secondsWatched: progress.secondsWatched,
      percentComplete: progress.percentComplete,
      completed: !!progress.completedAt,
    };
  }

  async markComplete(userId: string, dto: CompleteDto) {
    const { lessonId, finalTime, totalWatched } = dto;

    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new BadRequestException('Aula não encontrada');
    }

    // Check if really watched >= 90%
    const duration = lesson.durationSeconds;
    const percentWatched = (totalWatched / duration) * 100;

    if (percentWatched < CONFIG.COMPLETION_THRESHOLD) {
      throw new BadRequestException(
        `Você precisa assistir pelo menos ${CONFIG.COMPLETION_THRESHOLD}% do vídeo para concluir. ` +
          `Atual: ${Math.round(percentWatched)}%`
      );
    }

    // Mark as completed
    const progress = await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId, lessonId },
      },
      update: {
        lastPositionSeconds: Math.floor(finalTime),
        secondsWatched: Math.floor(totalWatched),
        percentComplete: 100,
        completedAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        lastPositionSeconds: Math.floor(finalTime),
        secondsWatched: Math.floor(totalWatched),
        percentComplete: 100,
        completedAt: new Date(),
      },
    });

    // Update enrollment progress
    await this.updateEnrollmentProgress(userId, lesson.moduleId);

    return {
      lessonId,
      completed: true,
      completedAt: progress.completedAt,
    };
  }

  async getLessonProgress(userId: string, lessonId: string) {
    const progress = await this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: { userId, lessonId },
      },
    });

    if (!progress) {
      return {
        lessonId,
        lastPosition: 0,
        secondsWatched: 0,
        percentComplete: 0,
        completed: false,
      };
    }

    return {
      lessonId,
      lastPosition: progress.lastPositionSeconds,
      secondsWatched: progress.secondsWatched,
      percentComplete: progress.percentComplete,
      completed: !!progress.completedAt,
      completedAt: progress.completedAt,
    };
  }

  async getCourseProgress(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });

    if (!course) {
      throw new BadRequestException('Curso não encontrado');
    }

    const allLessons = course.modules.flatMap((m) => m.lessons);
    const lessonIds = allLessons.map((l) => l.id);

    const progressList = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds },
      },
    });

    const progressMap = new Map(progressList.map((p) => [p.lessonId, p]));

    const lessonsProgress = allLessons.map((lesson) => {
      const progress = progressMap.get(lesson.id);
      return {
        lessonId: lesson.id,
        title: lesson.title,
        lastPosition: progress?.lastPositionSeconds || 0,
        percentComplete: progress?.percentComplete || 0,
        completed: !!progress?.completedAt,
      };
    });

    const completedCount = lessonsProgress.filter((l) => l.completed).length;
    const overallProgress = Math.round((completedCount / allLessons.length) * 100);

    return {
      courseId,
      totalLessons: allLessons.length,
      completedLessons: completedCount,
      overallProgress,
      lessons: lessonsProgress,
    };
  }

  private async updateEnrollmentProgress(userId: string, moduleId: string) {
    // Get the course from the module
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    });

    if (!module) return;

    const course = module.course;
    const allLessons = course.modules.flatMap((m) => m.lessons);

    // Count completed lessons
    const completedCount = await this.prisma.lessonProgress.count({
      where: {
        userId,
        lessonId: { in: allLessons.map((l) => l.id) },
        completedAt: { not: null },
      },
    });

    const progress = Math.round((completedCount / allLessons.length) * 100);
    const isCompleted = completedCount === allLessons.length;

    // Update enrollment
    await this.prisma.enrollment.updateMany({
      where: {
        userId,
        courseId: course.id,
      },
      data: {
        progress,
        status: isCompleted ? 'completed' : 'active',
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // Verificar e conceder badges se curso foi completado
    if (isCompleted) {
      await this.gamificationService.onCourseCompleted(userId, course.id);
    }
  }
}
