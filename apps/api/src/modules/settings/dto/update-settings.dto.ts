import { IsOptional, IsString, IsIn, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiPropertyOptional({ description: 'Cor primária do tema (hex)', example: '#f97316' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ description: 'Cor secundária do tema (hex)', example: '#141414' })
  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @ApiPropertyOptional({ description: 'Tipo do background do login', enum: ['color', 'image', 'video'] })
  @IsOptional()
  @IsIn(['color', 'image', 'video'])
  loginBgType?: string;

  @ApiPropertyOptional({ description: 'Cor do background do login (hex)', example: '#141414' })
  @IsOptional()
  @IsString()
  loginBgColor?: string;

  @ApiPropertyOptional({ description: 'URL da mídia do background do login' })
  @IsOptional()
  @IsString()
  loginBgMediaUrl?: string;

  @ApiPropertyOptional({ description: 'URL do logo da plataforma' })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class UploadSettingsMediaDto {
  @ApiPropertyOptional({ description: 'Nome do arquivo' })
  @IsString()
  fileName: string;

  @ApiPropertyOptional({ description: 'Tipo do conteúdo (MIME)' })
  @IsString()
  contentType: string;

  @ApiPropertyOptional({ description: 'Tipo de mídia', enum: ['logo', 'background'] })
  @IsIn(['logo', 'background'])
  mediaType: 'logo' | 'background';
}
