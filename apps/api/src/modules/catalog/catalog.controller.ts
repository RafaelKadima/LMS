import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Controller('catalog')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'Lista cursos do catálogo (filtrado por franquia e cargo)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  async getCatalog(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('page') page?: number,
    @Query('perPage') perPage?: number
  ) {
    return this.catalogService.getCatalog(user, { search, category, page, perPage });
  }

  @Get('continue-watching')
  @ApiOperation({ summary: 'Lista aulas em progresso (continue assistindo)' })
  async getContinueWatching(@CurrentUser() user: any) {
    return this.catalogService.getContinueWatching(user.sub);
  }

  @Get('required')
  @ApiOperation({ summary: 'Lista cursos obrigatórios para o cargo do usuário' })
  async getRequired(@CurrentUser() user: any) {
    return this.catalogService.getRequired(user);
  }

  @Get('recommended')
  @ApiOperation({ summary: 'Lista cursos recomendados' })
  async getRecommended(@CurrentUser() user: any) {
    return this.catalogService.getRecommended(user);
  }
}
