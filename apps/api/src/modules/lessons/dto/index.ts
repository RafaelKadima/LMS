import { IsString, IsOptional, IsUUID, IsEnum, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// Interface para material de apoio com metadados
export interface SupportMaterial {
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  mimeType: string;
  size?: number;
}

export class CreateLessonDto {
  @ApiProperty({ description: 'ID do módulo' })
  @IsUUID()
  moduleId: string;

  @ApiProperty({ description: 'Título da aula' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Descrição da aula' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Tipo da aula',
    enum: ['video', 'document', 'quiz', 'scorm'],
    default: 'video',
  })
  @IsOptional()
  @IsEnum(['video', 'document', 'quiz', 'scorm'])
  type?: 'video' | 'document' | 'quiz' | 'scorm';

  @ApiPropertyOptional({ description: 'Duração em segundos', default: 0 })
  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  @ApiPropertyOptional({ description: 'Ordem de exibição', default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({ description: 'URL do vídeo original' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'URL do manifest HLS (m3u8)' })
  @IsOptional()
  @IsString()
  manifestUrl?: string;

  @ApiPropertyOptional({ description: 'URL da thumbnail' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'URL do documento (PDF, etc)' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ description: 'Materiais de apoio com metadados (JSON)' })
  @IsOptional()
  supportMaterials?: any; // Prisma Json type - array of SupportMaterial objects
}

export class UpdateLessonDto extends PartialType(
  OmitType(CreateLessonDto, ['moduleId'] as const),
) {}
