import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ResetPasswordDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

interface UsersFilters {
  page?: number;
  perPage?: number;
  search?: string;
  role?: string;
  cargo?: string;
  franchiseId?: string;
  storeId?: string;
  isActive?: boolean;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  private buildWhereClause(currentUser: any, filters: UsersFilters) {
    const where: any = {};

    // Role-based filtering
    if (currentUser.role === 'franchise_admin') {
      where.franchiseId = currentUser.franchiseId;
    } else if (currentUser.role === 'store_manager') {
      where.storeId = currentUser.storeId;
    }
    // super_admin sees all

    // Additional filters
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.cargo) {
      where.cargo = filters.cargo;
    }

    if (filters.franchiseId && !where.franchiseId) {
      where.franchiseId = filters.franchiseId;
    }

    if (filters.storeId && !where.storeId) {
      where.storeId = filters.storeId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    return where;
  }

  async getUsers(currentUser: any, filters: UsersFilters) {
    const page = Number(filters.page) || 1;
    const perPage = Number(filters.perPage) || 20;
    const where = this.buildWhereClause(currentUser, filters);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          cargo: true,
          role: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          franchise: {
            select: { id: true, name: true },
          },
          store: {
            select: { id: true, name: true },
          },
          _count: {
            select: { enrollments: true, badgeAwards: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((user) => ({
        ...user,
        enrollmentsCount: user._count.enrollments,
        badgesCount: user._count.badgeAwards,
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
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        cargo: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        franchiseId: true,
        storeId: true,
        franchise: {
          select: { id: true, name: true },
        },
        store: {
          select: { id: true, name: true },
        },
        _count: {
          select: { enrollments: true, badgeAwards: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário com ID ${id} não encontrado`);
    }

    // Check permission to view this user
    if (currentUser) {
      if (currentUser.role === 'franchise_admin' && user.franchiseId !== currentUser.franchiseId) {
        throw new ForbiddenException('Sem permissão para visualizar este usuário');
      }
      if (currentUser.role === 'store_manager' && user.storeId !== currentUser.storeId) {
        throw new ForbiddenException('Sem permissão para visualizar este usuário');
      }
    }

    return {
      ...user,
      enrollmentsCount: user._count.enrollments,
      badgesCount: user._count.badgeAwards,
      _count: undefined,
    };
  }

  async create(dto: CreateUserDto, currentUser: any) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Check permission to create user in this franchise
    if (currentUser.role === 'franchise_admin' && dto.franchiseId !== currentUser.franchiseId) {
      throw new ForbiddenException('Sem permissão para criar usuário em outra franquia');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        franchiseId: dto.franchiseId,
        storeId: dto.storeId,
        cargo: dto.cargo,
        role: dto.role,
        avatarUrl: dto.avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        cargo: true,
        role: true,
        isActive: true,
        createdAt: true,
        franchise: {
          select: { name: true },
        },
        store: {
          select: { name: true },
        },
      },
    });
  }

  async update(id: string, dto: UpdateUserDto, currentUser: any) {
    // Verify user exists and get current data
    const existingUser = await this.findOne(id, currentUser);

    // Check if email is being changed and if it's unique
    if (dto.email && dto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new ConflictException('Email já está em uso');
      }
    }

    // Prevent franchise_admin from changing user to another franchise
    if (currentUser.role === 'franchise_admin' && dto.franchiseId && dto.franchiseId !== currentUser.franchiseId) {
      throw new ForbiddenException('Sem permissão para mover usuário para outra franquia');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.email && { email: dto.email }),
        ...(dto.name && { name: dto.name }),
        ...(dto.franchiseId && { franchiseId: dto.franchiseId }),
        ...(dto.storeId !== undefined && { storeId: dto.storeId }),
        ...(dto.cargo && { cargo: dto.cargo }),
        ...(dto.role && { role: dto.role }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        cargo: true,
        role: true,
        avatarUrl: true,
        isActive: true,
        updatedAt: true,
        franchise: {
          select: { name: true },
        },
        store: {
          select: { name: true },
        },
      },
    });
  }

  async remove(id: string, currentUser: any) {
    // Verify user exists and check permission
    await this.findOne(id, currentUser);

    // Soft delete: just deactivate
    await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return { deleted: true };
  }

  async resetPassword(id: string, dto: ResetPasswordDto, currentUser: any) {
    // Verify user exists and check permission
    await this.findOne(id, currentUser);

    // Generate random password if not provided
    const newPassword = dto.newPassword || this.generateRandomPassword();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return {
      success: true,
      temporaryPassword: dto.newPassword ? undefined : newPassword,
    };
  }

  async toggleActive(id: string, currentUser: any) {
    const user = await this.findOne(id, currentUser);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        isActive: true,
      },
    });
  }

  async getStats(currentUser: any) {
    const where: any = {};

    if (currentUser.role === 'franchise_admin') {
      where.franchiseId = currentUser.franchiseId;
    } else if (currentUser.role === 'store_manager') {
      where.storeId = currentUser.storeId;
    }

    const [totalUsers, activeUsers, byRole, byCargo] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.count({ where: { ...where, isActive: true } }),
      this.prisma.user.groupBy({
        by: ['role'],
        where,
        _count: true,
      }),
      this.prisma.user.groupBy({
        by: ['cargo'],
        where,
        _count: true,
      }),
    ]);

    return {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      byRole: byRole.map((r) => ({ role: r.role, count: r._count })),
      byCargo: byCargo.map((c) => ({ cargo: c.cargo, count: c._count })),
    };
  }

  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
