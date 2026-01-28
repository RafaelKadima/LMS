import { IsString, IsOptional, IsBoolean, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFranchiseDto {
  @ApiProperty({ description: 'Nome da franquia', example: 'MotoChefe São Paulo' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ description: 'CNPJ da franquia (apenas números)', example: '12345678000199' })
  @IsString()
  @Matches(/^\d{14}$/, { message: 'CNPJ deve conter 14 dígitos numéricos' })
  cnpj: string;

  @ApiProperty({ description: 'Slug único para URL', example: 'motochefe-sp' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug deve conter apenas letras minúsculas, números e hífens' })
  slug: string;

  @ApiPropertyOptional({ description: 'URL do logo da franquia' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Se a franquia está ativa', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
