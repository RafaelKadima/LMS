import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateModuleDto {
  @ApiProperty({ description: 'ID do curso' })
  @IsUUID()
  courseId: string;

  @ApiProperty({ description: 'Título do módulo' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Descrição do módulo', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Ordem de exibição', default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class UpdateModuleDto extends PartialType(CreateModuleDto) {}
