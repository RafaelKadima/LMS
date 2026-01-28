import { Injectable, NotFoundException } from '@nestjs/common';
import { Cargo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';

interface CoursesFilters {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
  franchiseId?: string;
}

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll(currentUser: any, filters: CoursesFilters) {
    const page = Number(filters.page) || 1;
    const perPage = Number(filters.perPage) || 20;
    const { search, status, franchiseId } = filters;

    const where: any = {};

    // Filtro por franquia baseado no role
    if (currentUser.role === 'franchise_admin') {
      where.OR = [
        { franchiseId: currentUser.franchiseId },
        { franchiseId: null }, // Cursos globais
      ];
    } else if (currentUser.role === 'store_manager') {
      // Store manager vê cursos da franquia dele + globais
      where.OR = [
        { franchiseId: currentUser.franchiseId },
        { franchiseId: null },
      ];
    }
    // super_admin vê todos

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (franchiseId && currentUser.role === 'super_admin') {
      where.franchiseId = franchiseId;
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: {
          franchise: {
            select: { id: true, name: true },
          },
          _count: {
            select: { modules: true, enrollments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses,
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async getById(id: string, userId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        modules: {
          include: {
            lessons: {
              include: {
                progress: {
                  where: { userId },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        enrollments: {
          where: { userId },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado');
    }

    return {
      ...course,
      modules: course.modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          type: lesson.type,
          durationSeconds: lesson.durationSeconds,
          thumbnailUrl: lesson.thumbnailUrl,
          manifestUrl: lesson.manifestUrl,
          videoUrl: lesson.videoUrl,
          documentUrl: lesson.documentUrl,
          supportMaterials: lesson.supportMaterials,
          order: lesson.order,
          progress: lesson.progress[0] || null,
        })),
      })),
      enrollment: course.enrollments[0] || null,
    };
  }

  async create(dto: CreateCourseDto, franchiseId: string) {
    const { targetCargos, ...rest } = dto;
    return this.prisma.course.create({
      data: {
        ...rest,
        targetCargos: targetCargos as Cargo[],
        franchiseId: dto.isGlobal ? null : franchiseId,
      },
    });
  }

  async update(id: string, dto: UpdateCourseDto) {
    const { targetCargos, ...rest } = dto;
    return this.prisma.course.update({
      where: { id },
      data: {
        ...rest,
        ...(targetCargos && { targetCargos: targetCargos as Cargo[] }),
      },
    });
  }

  async delete(id: string) {
    await this.prisma.course.delete({
      where: { id },
    });
    return { deleted: true };
  }
}
