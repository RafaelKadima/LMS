import { IsUUID, IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestUploadDto {
  @ApiProperty({ description: 'ID da aula' })
  @IsUUID()
  lessonId: string;

  @ApiProperty({ description: 'Nome do arquivo' })
  @IsString()
  fileName: string;

  @ApiProperty({ description: 'MIME type do arquivo', example: 'video/mp4' })
  @IsString()
  contentType: string;

  @ApiProperty({ description: 'Tamanho do arquivo em bytes' })
  @IsNumber()
  @Min(1)
  @Max(500 * 1024 * 1024) // 500MB max
  fileSize: number;
}

export class CompleteUploadDto {
  @ApiProperty({ description: 'ID da aula' })
  @IsUUID()
  lessonId: string;

  @ApiProperty({ description: 'Chave do arquivo no R2' })
  @IsString()
  key: string;

  @ApiProperty({ description: 'ID do upload' })
  @IsString()
  uploadId: string;
}
