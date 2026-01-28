import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ example: 'Loja Centro', description: 'Nome da loja' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'uuid-da-franquia', description: 'ID da franquia' })
  @IsUUID()
  franchiseId: string;

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
}
