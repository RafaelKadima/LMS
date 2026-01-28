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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto, ResetPasswordDto } from './dto/update-user.dto';

@ApiTags('users')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('super_admin', 'franchise_admin', 'store_manager')
  @ApiOperation({ summary: 'Lista usuários (filtrado por permissão)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'cargo', required: false, type: String })
  @ApiQuery({ name: 'franchiseId', required: false, type: String })
  @ApiQuery({ name: 'storeId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async getUsers(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('cargo') cargo?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('storeId') storeId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.usersService.getUsers(user, {
      page,
      perPage,
      search,
      role,
      cargo,
      franchiseId,
      storeId,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Get('stats')
  @Roles('super_admin', 'franchise_admin', 'store_manager')
  @ApiOperation({ summary: 'Estatísticas de usuários' })
  async getStats(@CurrentUser() user: any) {
    return this.usersService.getStats(user);
  }

  @Get(':id')
  @Roles('super_admin', 'franchise_admin', 'store_manager')
  @ApiOperation({ summary: 'Obtém um usuário pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.findOne(id, user);
  }

  @Post()
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Cria um novo usuário' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.usersService.create(dto, user);
  }

  @Put(':id')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Atualiza um usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Desativa um usuário (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.remove(id, user);
  }

  @Post(':id/reset-password')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Reseta a senha de um usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() user: any,
  ) {
    return this.usersService.resetPassword(id, dto, user);
  }

  @Post(':id/toggle-active')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Ativa/desativa um usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  async toggleActive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.usersService.toggleActive(id, user);
  }
}
