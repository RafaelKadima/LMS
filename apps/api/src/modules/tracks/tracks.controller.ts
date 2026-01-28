import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TracksService } from './tracks.service';

@ApiTags('tracks')
@Controller('tracks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TracksController {
  constructor(private readonly tracksService: TracksService) {}

  @Get()
  @ApiOperation({ summary: 'Lista trilhas disponíveis para o usuário' })
  async getAll(@CurrentUser() user: any) {
    return this.tracksService.getAll(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna detalhes de uma trilha' })
  async getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tracksService.getById(id, user.sub);
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Inscreve o usuário em todos os cursos da trilha' })
  async enroll(@CurrentUser() user: any, @Param('id') id: string) {
    return this.tracksService.enrollInTrack(id, user.sub);
  }
}
