import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ description: 'Título do curso' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Descrição do curso' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'URL da thumbnail', required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Status do curso',
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: 'draft' | 'published' | 'archived';

  @ApiProperty({
    description: 'Cargos alvo do curso',
    type: [String],
    enum: ['mecanico', 'atendente', 'gerente', 'proprietario'],
    required: false
  })
  @IsOptional()
  @IsArray()
  targetCargos?: string[];

  @ApiProperty({ description: 'Se o curso é obrigatório', default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({ description: 'Duração em minutos', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMinutes?: number;

  @ApiProperty({ description: 'Se o curso é global (todas as franquias)', default: false })
  @IsOptional()
  @IsBoolean()
  isGlobal?: boolean;

  @ApiProperty({ description: 'Ordem de exibição', default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
