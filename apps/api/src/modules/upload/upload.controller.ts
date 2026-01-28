import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UploadService } from './upload.service';
import { RequestUploadDto, CompleteUploadDto } from './dto';

@ApiTags('upload')
@Controller('admin/upload')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('video/presign')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Gera URL assinada para upload de vídeo ao R2' })
  @ApiResponse({ status: 200, description: 'URL assinada gerada' })
  async requestUploadUrl(@Body() dto: RequestUploadDto) {
    return this.uploadService.generatePresignedUrl(dto);
  }

  @Post('video/complete')
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Notifica conclusão do upload e inicia processamento' })
  @ApiResponse({ status: 200, description: 'Processamento iniciado' })
  async completeUpload(@Body() dto: CompleteUploadDto) {
    return this.uploadService.initiateProcessing(dto);
  }
}
