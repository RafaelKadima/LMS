import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';

@ApiTags('courses')
@Controller('courses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin', 'store_manager')
  @ApiOperation({ summary: 'Lista todos os cursos com paginação' })
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.coursesService.findAll(user, {
      page: page ? parseInt(page) : 1,
      perPage: perPage ? parseInt(perPage) : 20,
      search,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retorna detalhes de um curso com módulos e aulas' })
  async getById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.coursesService.getById(id, user.sub);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Cria um novo curso' })
  async create(@CurrentUser() user: any, @Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto, user.franchiseId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Atualiza um curso' })
  async update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Remove um curso' })
  async delete(@Param('id') id: string) {
    return this.coursesService.delete(id);
  }
}
