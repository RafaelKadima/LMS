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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LessonsService } from './lessons.service';
import { PdfThumbnailService } from './pdf-thumbnail.service';
import { CreateLessonDto, UpdateLessonDto, SupportMaterial } from './dto';

// Pasta de uploads de conteúdo das aulas
const UPLOAD_PATH = join(process.cwd(), '..', 'web', 'public', 'uploads', 'lessons');

// Garantir que a pasta existe
if (!existsSync(UPLOAD_PATH)) {
  mkdirSync(UPLOAD_PATH, { recursive: true });
}

@ApiTags('lessons')
@Controller('lessons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LessonsController {
  constructor(
    private readonly lessonsService: LessonsService,
    private readonly pdfThumbnailService: PdfThumbnailService,
  ) {}

  @Get(':id')
  @ApiOperation({ summary: 'Retorna detalhes de uma aula' })
  async getById(
    @CurrentUser('sub') userId: string,
    @Param('id') id: string,
  ) {
    return this.lessonsService.getById(id, userId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Cria uma nova aula' })
  async create(@Body() dto: CreateLessonDto) {
    return this.lessonsService.create(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Atualiza uma aula' })
  async update(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Remove uma aula' })
  async delete(@Param('id') id: string) {
    return this.lessonsService.delete(id);
  }

  @Post(':id/upload')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Upload de vídeo/documento para uma aula' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, UPLOAD_PATH);
        },
        filename: (req, file, cb) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: {
        fileSize: 1024 * 1024 * 1024, // 1GB para vídeos
      },
      fileFilter: (req, file, cb) => {
        const allowedMimes = [
          // Vídeos
          'video/mp4',
          'video/webm',
          'video/quicktime',
          'video/x-msvideo',
          // Documentos
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          // Imagens (thumbnail)
          'image/jpeg',
          'image/png',
          'image/webp',
        ];
        if (allowedMimes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              'Tipo de arquivo não permitido. Use vídeo (mp4, webm), documento (pdf, doc, ppt) ou imagem.',
            ),
            false,
          );
        }
      },
    }),
  )
  async uploadContent(
    @Param('id') id: string,
    @Query('uploadType') uploadType: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    const publicUrl = `/uploads/lessons/${file.filename}`;
    const isVideo = file.mimetype.startsWith('video/');
    const isPdf = file.mimetype === 'application/pdf';
    const isDocument =
      file.mimetype.startsWith('application/') &&
      !file.mimetype.includes('octet-stream');
    const isImage = file.mimetype.startsWith('image/');

    // Atualizar a aula com a URL do arquivo
    const updateData: any = {};

    // Se for upload de material de apoio
    if (uploadType === 'support') {
      if (!isDocument) {
        throw new BadRequestException('Material de apoio deve ser um documento (PDF, DOC, PPT)');
      }

      // Gerar thumbnail se for PDF
      let thumbnailUrl: string | null = null;
      if (isPdf) {
        thumbnailUrl = await this.pdfThumbnailService.generateThumbnail(file.path);
      }

      // Criar objeto de material com metadados
      const newMaterial: SupportMaterial = {
        url: publicUrl,
        thumbnailUrl: thumbnailUrl || undefined,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      };

      // Buscar aula atual para obter array existente
      const currentLesson = await this.lessonsService.findOne(id);
      const currentMaterials = (currentLesson?.supportMaterials as unknown as SupportMaterial[]) || [];
      updateData.supportMaterials = [...currentMaterials, newMaterial];
    } else {
      // Upload de conteúdo principal
      if (isVideo) {
        updateData.videoUrl = publicUrl;
        updateData.type = 'video';
      } else if (isDocument) {
        updateData.documentUrl = publicUrl;
        updateData.type = 'document';
      } else if (isImage) {
        updateData.thumbnailUrl = publicUrl;
      }
    }

    await this.lessonsService.update(id, updateData);

    return {
      url: publicUrl,
      type: uploadType === 'support' ? 'support' : isVideo ? 'video' : isDocument ? 'document' : 'image',
      filename: file.filename,
      size: file.size,
    };
  }

  @Delete(':id/support-material')
  @UseGuards(RolesGuard)
  @Roles('super_admin', 'franchise_admin')
  @ApiOperation({ summary: 'Remove um material de apoio da aula' })
  async removeSupportMaterial(
    @Param('id') id: string,
    @Body('url') url: string,
  ) {
    const lesson = await this.lessonsService.findOne(id);
    if (!lesson) {
      throw new BadRequestException('Aula não encontrada');
    }

    const currentMaterials = (lesson.supportMaterials as unknown as SupportMaterial[]) || [];
    const updatedMaterials = currentMaterials.filter(
      (material) => material.url !== url,
    );

    await this.lessonsService.update(id, { supportMaterials: updatedMaterials });

    return { success: true, supportMaterials: updatedMaterials };
  }
}
