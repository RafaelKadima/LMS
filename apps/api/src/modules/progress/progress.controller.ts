import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProgressService } from './progress.service';
import { HeartbeatDto, CompleteDto } from './dto';

@ApiTags('progress')
@Controller('progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('heartbeat')
  @ApiOperation({ summary: 'Atualiza progresso do vídeo (chamado a cada 5-10s)' })
  @ApiResponse({ status: 200, description: 'Progresso atualizado' })
  async heartbeat(@CurrentUser('sub') userId: string, @Body() dto: HeartbeatDto) {
    return this.progressService.updateProgress(userId, dto);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Marca aula como concluída (>= 90% assistido)' })
  @ApiResponse({ status: 200, description: 'Aula marcada como concluída' })
  @ApiResponse({ status: 400, description: 'Progresso insuficiente' })
  async complete(@CurrentUser('sub') userId: string, @Body() dto: CompleteDto) {
    return this.progressService.markComplete(userId, dto);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Retorna progresso de uma aula específica' })
  async getLessonProgress(
    @CurrentUser('sub') userId: string,
    @Param('lessonId') lessonId: string
  ) {
    return this.progressService.getLessonProgress(userId, lessonId);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Retorna progresso de todas as aulas de um curso' })
  async getCourseProgress(
    @CurrentUser('sub') userId: string,
    @Param('courseId') courseId: string
  ) {
    return this.progressService.getCourseProgress(userId, courseId);
  }
}
