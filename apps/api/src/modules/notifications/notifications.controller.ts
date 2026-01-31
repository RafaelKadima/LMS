import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista notificações do usuário logado' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  async findAll(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
  ) {
    return this.service.findForUser(userId, Number(page) || 1, Number(perPage) || 20);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Conta notificações não lidas' })
  async unreadCount(@CurrentUser('sub') userId: string) {
    return this.service.countUnread(userId);
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Marca uma notificação como lida' })
  async markRead(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    await this.service.markRead(id, userId);
    return { success: true };
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Marca todas as notificações como lidas' })
  async markAllRead(@CurrentUser('sub') userId: string) {
    await this.service.markAllRead(userId);
    return { success: true };
  }
}
