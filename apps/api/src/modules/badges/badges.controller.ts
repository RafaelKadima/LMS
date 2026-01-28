import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BadgesService } from './badges.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';

@ApiTags('badges')
@Controller('admin/badges')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Lista todos os badges' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
    @Query('search') search?: string,
  ) {
    return this.badgesService.findAll({ page, perPage, search });
  }

  @Get('stats')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Estatísticas de badges' })
  async getStats() {
    return this.badgesService.getStats();
  }

  @Get(':id')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Obtém um badge pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do badge' })
  async findOne(@Param('id') id: string) {
    return this.badgesService.findOne(id);
  }

  @Post()
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Cria um novo badge' })
  async create(@Body() dto: CreateBadgeDto) {
    return this.badgesService.create(dto);
  }

  @Put(':id')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Atualiza um badge' })
  @ApiParam({ name: 'id', description: 'ID do badge' })
  async update(@Param('id') id: string, @Body() dto: UpdateBadgeDto) {
    return this.badgesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Remove um badge' })
  @ApiParam({ name: 'id', description: 'ID do badge' })
  async remove(@Param('id') id: string) {
    return this.badgesService.remove(id);
  }

  @Post(':badgeId/award/:userId')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Concede um badge a um usuário' })
  @ApiParam({ name: 'badgeId', description: 'ID do badge' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  async awardBadge(
    @Param('badgeId') badgeId: string,
    @Param('userId') userId: string,
  ) {
    return this.badgesService.awardBadge(badgeId, userId);
  }

  @Delete(':badgeId/award/:userId')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Revoga um badge de um usuário' })
  @ApiParam({ name: 'badgeId', description: 'ID do badge' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  async revokeBadge(
    @Param('badgeId') badgeId: string,
    @Param('userId') userId: string,
  ) {
    return this.badgesService.revokeBadge(badgeId, userId);
  }
}
