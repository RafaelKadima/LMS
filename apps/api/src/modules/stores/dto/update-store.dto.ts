import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoreDto {
  @ApiPropertyOptional({ example: 'Loja Centro', description: 'Nome da loja' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'uuid-da-franquia', description: 'ID da franquia' })
  @IsUUID()
  @IsOptional()
  franchiseId?: string;

  @ApiPropertyOptional({ example: 'Av. Paulista, 1000', description: 'Endereço da loja' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'São Paulo', description: 'Cidade' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'SP', description: 'Estado' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: true, description: 'Se a loja está ativa' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
