import { IsString, IsUUID, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class StatementDataDto {
  @ApiProperty({ description: 'Tempo atual do vídeo em segundos', required: false })
  currentTime?: number;

  @ApiProperty({ description: 'Duração total do vídeo em segundos', required: false })
  duration?: number;

  @ApiProperty({ description: 'Tempo de origem do seek em segundos', required: false })
  timeFrom?: number;

  @ApiProperty({ description: 'Tempo de destino do seek em segundos', required: false })
  timeTo?: number;

  @ApiProperty({ description: 'Total de segundos assistidos', required: false })
  totalWatched?: number;
}

export class SendStatementDto {
  @ApiProperty({
    description: 'Verbo xAPI do evento',
    enum: ['played', 'paused', 'seeked', 'completed']
  })
  @IsEnum(['played', 'paused', 'seeked', 'completed'])
  verb: 'played' | 'paused' | 'seeked' | 'completed';

  @ApiProperty({ description: 'ID da aula' })
  @IsUUID()
  lessonId: string;

  @ApiProperty({ description: 'Título da aula' })
  @IsString()
  lessonTitle: string;

  @ApiProperty({ description: 'ID do curso' })
  @IsUUID()
  courseId: string;

  @ApiProperty({ description: 'Título do curso' })
  @IsString()
  courseTitle: string;

  @ApiProperty({ description: 'Dados do evento', type: StatementDataDto })
  @IsObject()
  @ValidateNested()
  @Type(() => StatementDataDto)
  data: StatementDataDto;
}
