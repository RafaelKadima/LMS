import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { UpdateFranchiseDto } from './dto/update-franchise.dto';

@Injectable()
export class FranchisesService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: {
    page?: number;
    perPage?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const page = params?.page || 1;
    const perPage = params?.perPage || 20;
    const skip = (page - 1) * perPage;

    const where: any = {};

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { cnpj: { contains: params.search } },
        { slug: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params?.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.franchise.findMany({
        where,
        include: {
          _count: {
            select: {
              stores: true,
              users: true,
            },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: perPage,
      }),
      this.prisma.franchise.count({ where }),
    ]);

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

  async findOne(id: string) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { id },
      include: {
        stores: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            stores: true,
            users: true,
            courses: true,
          },
        },
      },
    });

    if (!franchise) {
      throw new NotFoundException('Franquia não encontrada');
    }

    return franchise;
  }

  async create(dto: CreateFranchiseDto) {
    // Verificar CNPJ único
    const existingCnpj = await this.prisma.franchise.findUnique({
      where: { cnpj: dto.cnpj },
    });

    if (existingCnpj) {
      throw new ConflictException('CNPJ já cadastrado');
    }

    // Verificar slug único
    const existingSlug = await this.prisma.franchise.findUnique({
      where: { slug: dto.slug },
    });

    if (existingSlug) {
      throw new ConflictException('Slug já está em uso');
    }

    return this.prisma.franchise.create({
      data: {
        name: dto.name,
        cnpj: dto.cnpj,
        slug: dto.slug,
        logoUrl: dto.logoUrl,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateFranchiseDto) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { id },
    });

    if (!franchise) {
      throw new NotFoundException('Franquia não encontrada');
    }

    // Verificar CNPJ único (se estiver sendo alterado)
    if (dto.cnpj && dto.cnpj !== franchise.cnpj) {
      const existingCnpj = await this.prisma.franchise.findUnique({
        where: { cnpj: dto.cnpj },
      });

      if (existingCnpj) {
        throw new ConflictException('CNPJ já cadastrado');
      }
    }

    // Verificar slug único (se estiver sendo alterado)
    if (dto.slug && dto.slug !== franchise.slug) {
      const existingSlug = await this.prisma.franchise.findUnique({
        where: { slug: dto.slug },
      });

      if (existingSlug) {
        throw new ConflictException('Slug já está em uso');
      }
    }

    return this.prisma.franchise.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.cnpj && { cnpj: dto.cnpj }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async remove(id: string) {
    const franchise = await this.prisma.franchise.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            stores: true,
            users: true,
          },
        },
      },
    });

    if (!franchise) {
      throw new NotFoundException('Franquia não encontrada');
    }

    // Verificar se tem lojas ou usuários vinculados
    if (franchise._count.stores > 0 || franchise._count.users > 0) {
      throw new ConflictException(
        'Não é possível excluir franquia com lojas ou usuários vinculados. Desative-a em vez disso.',
      );
    }

    await this.prisma.franchise.delete({ where: { id } });

    return { message: 'Franquia excluída com sucesso' };
  }

  async getStats() {
    const franchises = await this.prisma.franchise.findMany({
      include: {
        users: {
          include: {
            enrollments: {
              where: { status: 'completed' },
            },
          },
        },
        _count: {
          select: {
            stores: true,
            users: true,
          },
        },
      },
    });

    return franchises.map((f) => {
      const totalEnrollments = f.users.reduce(
        (acc, u) => acc + u.enrollments.length,
        0,
      );

      return {
        id: f.id,
        name: f.name,
        slug: f.slug,
        storesCount: f._count.stores,
        usersCount: f._count.users,
        completedCourses: totalEnrollments,
        avgCompletions:
          f._count.users > 0
            ? (totalEnrollments / f._count.users).toFixed(1)
            : 0,
      };
    });
  }
}
