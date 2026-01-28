import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateModuleDto, UpdateModuleDto } from './dto';

@Injectable()
export class ModulesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateModuleDto) {
    return this.prisma.module.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateModuleDto) {
    return this.prisma.module.update({
      where: { id },
      data: dto,
    });
  }

  async delete(id: string) {
    await this.prisma.module.delete({
      where: { id },
    });
    return { deleted: true };
  }
}
