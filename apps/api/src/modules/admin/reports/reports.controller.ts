import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ReportsService } from './reports.service';

@ApiTags('admin/reports')
@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'franchise_admin', 'store_manager')
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('progress')
  @ApiOperation({ summary: 'Relatório de progresso dos usuários' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'completed'] })
  @ApiQuery({ name: 'franchiseId', required: false })
  async getProgressReport(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
    @Query('search') search?: string,
    @Query('courseId') courseId?: string,
    @Query('status') status?: 'active' | 'completed',
    @Query('franchiseId') franchiseId?: string,
  ) {
    return this.reportsService.getProgressReport(user, {
      page,
      perPage,
      search,
      courseId,
      status,
      franchiseId,
    });
  }

  @Get('progress/:userId')
  @ApiOperation({ summary: 'Detalhes de progresso de um usuário específico' })
  async getUserDetailedProgress(@Param('userId') userId: string) {
    return this.reportsService.getUserDetailedProgress(userId);
  }
}
