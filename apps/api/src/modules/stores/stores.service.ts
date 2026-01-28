import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

interface StoresFilters {
  page?: number;
  perPage?: number;
  search?: string;
  franchiseId?: string;
  isActive?: boolean;
}

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  async findAll(currentUser: any, filters: StoresFilters) {
    const page = Number(filters.page) || 1;
    const perPage = Number(filters.perPage) || 20;
    const { search, franchiseId, isActive } = filters;

    const where: any = {};

    // Role-based filtering
    if (currentUser.role === 'franchise_admin') {
      where.franchiseId = currentUser.franchiseId;
    } else if (currentUser.role === 'store_manager') {
      where.id = currentUser.storeId;
    }
    // super_admin sees all

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (franchiseId && !where.franchiseId) {
      where.franchiseId = franchiseId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        include: {
          franchise: {
            select: { id: true, name: true },
          },
          _count: {
            select: { users: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.store.count({ where }),
    ]);

    return {
      data: stores.map((store) => ({
        ...store,
        usersCount: store._count.users,
        _count: undefined,
      })),
      meta: {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  async findOne(id: string, currentUser?: any) {
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        franchise: {
          select: { id: true, name: true },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!store) {
      throw new NotFoundException(`Loja com ID ${id} não encontrada`);
    }

    // Check permission
    if (currentUser) {
      if (currentUser.role === 'franchise_admin' && store.franchiseId !== currentUser.franchiseId) {
        throw new ForbiddenException('Sem permissão para visualizar esta loja');
      }
      if (currentUser.role === 'store_manager' && store.id !== currentUser.storeId) {
        throw new ForbiddenException('Sem permissão para visualizar esta loja');
      }
    }

    return {
      ...store,
      usersCount: store._count.users,
      _count: undefined,
    };
  }

  async create(dto: CreateStoreDto, currentUser: any) {
    // Check permission
    if (currentUser.role === 'franchise_admin' && dto.franchiseId !== currentUser.franchiseId) {
      throw new ForbiddenException('Sem permissão para criar loja em outra franquia');
    }

    return this.prisma.store.create({
      data: {
        name: dto.name,
        franchiseId: dto.franchiseId,
        address: dto.address,
        city: dto.city,
        state: dto.state,
      },
      include: {
        franchise: {
          select: { name: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateStoreDto, currentUser: any) {
    const store = await this.findOne(id, currentUser);

    // Prevent moving store to another franchise
    if (currentUser.role === 'franchise_admin' && dto.franchiseId && dto.franchiseId !== currentUser.franchiseId) {
      throw new ForbiddenException('Sem permissão para mover loja para outra franquia');
    }

    return this.prisma.store.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.franchiseId && { franchiseId: dto.franchiseId }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        franchise: {
          select: { name: true },
        },
      },
    });
  }

  async remove(id: string, currentUser: any) {
    await this.findOne(id, currentUser);

    // Soft delete
    await this.prisma.store.update({
      where: { id },
      data: { isActive: false },
    });

    return { deleted: true };
  }

  async getStats(currentUser: any) {
    const where: any = {};

    if (currentUser.role === 'franchise_admin') {
      where.franchiseId = currentUser.franchiseId;
    } else if (currentUser.role === 'store_manager') {
      where.id = currentUser.storeId;
    }

    const [totalStores, activeStores, storesByFranchise] = await Promise.all([
      this.prisma.store.count({ where }),
      this.prisma.store.count({ where: { ...where, isActive: true } }),
      this.prisma.store.groupBy({
        by: ['franchiseId'],
        where,
        _count: true,
      }),
    ]);

    return {
      total: totalStores,
      active: activeStores,
      inactive: totalStores - activeStores,
      byFranchise: storesByFranchise.map((s) => ({
        franchiseId: s.franchiseId,
        count: s._count,
      })),
    };
  }
}
