import { IsString, IsOptional, IsInt, Min, IsObject, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBadgeDto {
  @ApiProperty({ example: 'Primeiro Passo', description: 'Nome do badge' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Complete seu primeiro curso', description: 'Descrição do badge' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/badge.png', description: 'URL da imagem do badge' })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: 10, description: 'Pontos concedidos ao ganhar o badge' })
  @IsInt()
  @Min(0)
  points: number;

  @ApiPropertyOptional({
    example: { type: 'course_completion', count: 1 },
    description: 'Critérios para obtenção do badge',
  })
  @IsObject()
  @IsOptional()
  criteriaJson?: Record<string, any>;
}
