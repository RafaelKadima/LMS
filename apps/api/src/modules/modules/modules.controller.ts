import { Controller, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ModulesService } from './modules.service';
import { CreateModuleDto, UpdateModuleDto } from './dto';

@ApiTags('modules')
@Controller('modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ModulesController {
  constructor(private readonly modulesService: ModulesService) {}

  @Post()
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Cria um novo módulo' })
  async create(@Body() dto: CreateModuleDto) {
    return this.modulesService.create(dto);
  }

  @Put(':id')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Atualiza um módulo' })
  async update(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.modulesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Remove um módulo' })
  async delete(@Param('id') id: string) {
    return this.modulesService.delete(id);
  }
}
