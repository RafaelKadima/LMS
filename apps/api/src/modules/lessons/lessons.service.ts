import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto, UpdateLessonDto } from './dto';

@Injectable()
export class LessonsService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
            lessons: {
              select: {
                id: true,
                title: true,
                order: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        progress: {
          where: { userId },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Aula não encontrada');
    }

    // Find previous and next lessons
    const allLessons = lesson.module.lessons;
    const currentIndex = allLessons.findIndex((l) => l.id === id);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      durationSeconds: lesson.durationSeconds,
      videoUrl: lesson.videoUrl,
      manifestUrl: lesson.manifestUrl,
      thumbnailUrl: lesson.thumbnailUrl,
      documentUrl: lesson.documentUrl,
      supportMaterials: lesson.supportMaterials,
      processingStatus: lesson.processingStatus,
      course: lesson.module.course,
      progress: lesson.progress[0] || null,
      navigation: {
        prev: prevLesson,
        next: nextLesson,
      },
    };
  }

  async findOne(id: string) {
    return this.prisma.lesson.findUnique({
      where: { id },
    });
  }

  async create(dto: CreateLessonDto) {
    // Remove null/undefined values to avoid Prisma validation errors
    const data: Record<string, any> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value != null) {
        data[key] = value;
      }
    }
    return this.prisma.lesson.create({ data: data as any });
  }

  async update(id: string, dto: UpdateLessonDto) {
    const data: Record<string, any> = {};
    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        data[key] = value;
      }
    }
    return this.prisma.lesson.update({
      where: { id },
      data: data as any,
    });
  }

  async delete(id: string) {
    await this.prisma.lesson.delete({
      where: { id },
    });
    return { deleted: true };
  }
}
