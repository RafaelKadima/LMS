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
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto, UpdateMeetingDto, RespondMeetingDto } from './dto';

@ApiTags('meetings')
@Controller('meetings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MeetingsController {
  constructor(private readonly service: MeetingsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Cria uma nova reunião' })
  async create(
    @Body() dto: CreateMeetingDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Lista reuniões do usuário' })
  @ApiQuery({ name: 'filter', required: false, enum: ['upcoming', 'past'] })
  async findAll(
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
    @Query('filter') filter?: 'upcoming' | 'past',
  ) {
    return this.service.findAll(userId, role, filter);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Lista reuniões (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAllAdmin(
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
    @Query('search') search?: string,
  ) {
    return this.service.findAllAdmin(Number(page) || 1, Number(perPage) || 20, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhes de uma reunião' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.findOne(id, userId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Atualiza uma reunião' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Cancela/exclui uma reunião' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
    @CurrentUser('role') role: string,
  ) {
    return this.service.delete(id, userId, role);
  }

  @Post(':id/respond')
  @ApiOperation({ summary: 'RSVP: aceitar ou recusar convite' })
  async respond(
    @Param('id') meetingId: string,
    @Body() dto: RespondMeetingDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.respond(meetingId, userId, dto.response);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Entrar na reunião (retorna info do Jitsi)' })
  async join(
    @Param('id') meetingId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.join(meetingId, userId);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Sair da reunião' })
  async leave(
    @Param('id') meetingId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.leave(meetingId, userId);
  }

  @Post(':id/start')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Iniciar reunião (muda status para live)' })
  async start(
    @Param('id') meetingId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.start(meetingId, userId);
  }

  @Post(':id/end')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Encerrar reunião' })
  async end(
    @Param('id') meetingId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.end(meetingId, userId);
  }
}
