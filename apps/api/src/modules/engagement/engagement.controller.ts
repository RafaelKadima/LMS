import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EngagementService } from './engagement.service';
import { CreateEngagementEventDto, BatchEngagementEventDto } from './dto';

@ApiTags('engagement')
@Controller('engagement')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Post('events')
  @ApiOperation({ summary: 'Registrar evento de engajamento (face detection)' })
  @ApiResponse({ status: 201, description: 'Evento registrado' })
  async createEvent(
    @CurrentUser('sub') userId: string,
    @Body() dto: CreateEngagementEventDto,
  ) {
    return this.engagementService.createEvent(userId, dto);
  }

  @Post('events/batch')
  @ApiOperation({ summary: 'Registrar lote de eventos de engajamento' })
  @ApiResponse({ status: 201, description: 'Eventos registrados' })
  async createBatch(
    @CurrentUser('sub') userId: string,
    @Body() dto: BatchEngagementEventDto,
  ) {
    return this.engagementService.createBatch(userId, dto);
  }

  @Get('report/:userId/:courseId')
  @ApiOperation({ summary: 'Relatório de engajamento do aluno em um curso' })
  async getReport(
    @Param('userId') userId: string,
    @Param('courseId') courseId: string,
  ) {
    return this.engagementService.getReport(userId, courseId);
  }

  @Get('report/:userId/lesson/:lessonId')
  @ApiOperation({ summary: 'Relatório de engajamento do aluno em uma aula' })
  async getLessonReport(
    @Param('userId') userId: string,
    @Param('lessonId') lessonId: string,
  ) {
    return this.engagementService.getLessonReport(userId, lessonId);
  }
}
