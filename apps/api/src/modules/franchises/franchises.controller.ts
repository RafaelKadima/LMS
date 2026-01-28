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
import { FranchisesService } from './franchises.service';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { UpdateFranchiseDto } from './dto/update-franchise.dto';

@ApiTags('franchises')
@Controller('admin/franchises')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FranchisesController {
  constructor(private readonly franchisesService: FranchisesService) {}

  @Get()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Lista todas as franquias' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(
    @Query('page') page?: number,
    @Query('perPage') perPage?: number,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.franchisesService.findAll({
      page,
      perPage,
      search,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Get('stats')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Estatísticas por franquia' })
  async getStats() {
    return this.franchisesService.getStats();
  }

  @Get(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Obtém uma franquia pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da franquia' })
  async findOne(@Param('id') id: string) {
    return this.franchisesService.findOne(id);
  }

  @Post()
  @Roles('super_admin')
  @ApiOperation({ summary: 'Cria uma nova franquia' })
  async create(@Body() dto: CreateFranchiseDto) {
    return this.franchisesService.create(dto);
  }

  @Put(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Atualiza uma franquia' })
  @ApiParam({ name: 'id', description: 'ID da franquia' })
  async update(@Param('id') id: string, @Body() dto: UpdateFranchiseDto) {
    return this.franchisesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('super_admin')
  @ApiOperation({ summary: 'Remove uma franquia' })
  @ApiParam({ name: 'id', description: 'ID da franquia' })
  async remove(@Param('id') id: string) {
    return this.franchisesService.remove(id);
  }
}
