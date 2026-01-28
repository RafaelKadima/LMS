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
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@ApiTags('stores')
@Controller('admin/stores')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  @Roles('super_admin', 'franchise_admin', 'store_manager')
  @ApiOperation({ summary: 'Lista lojas (filtrado por permissão)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'franchiseId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
    @Query('search') search?: string,
    @Query('franchiseId') franchiseId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.storesService.findAll(user, {
      page,
      perPage,
      search,
      franchiseId,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Get('stats')
  @Roles('super_admin', 'franchise_admin', 'store_manager')
  @ApiOperation({ summary: 'Estatísticas de lojas' })
  async getStats(@CurrentUser() user: any) {
    return this.storesService.getStats(user);
  }

  @Get(':id')
  @Roles('super_admin', 'franchise_admin', 'store_manager')
  @ApiOperation({ summary: 'Obtém uma loja pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da loja' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.storesService.findOne(id, user);
  }

  @Post()
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Cria uma nova loja' })
  async create(@Body() dto: CreateStoreDto, @CurrentUser() user: any) {
    return this.storesService.create(dto, user);
  }

  @Put(':id')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Atualiza uma loja' })
  @ApiParam({ name: 'id', description: 'ID da loja' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
    @CurrentUser() user: any,
  ) {
    return this.storesService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Remove uma loja (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID da loja' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.storesService.remove(id, user);
  }
}
