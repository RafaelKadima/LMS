import { IsUUID, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HeartbeatDto {
  @ApiProperty({ description: 'ID da aula' })
  @IsUUID()
  lessonId: string;

  @ApiProperty({ description: 'Posição atual do vídeo em segundos' })
  @IsNumber()
  @Min(0)
  currentTime: number;

  @ApiProperty({ description: 'Duração total do vídeo em segundos' })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({ description: 'Velocidade de reprodução (0.5 a 2.0)' })
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  playbackRate: number;

  @ApiProperty({ description: 'Tipo de evento do player', enum: ['playing', 'paused', 'seeked', 'ended'] })
  @IsEnum(['playing', 'paused', 'seeked', 'ended'])
  event: 'playing' | 'paused' | 'seeked' | 'ended';
}

export class CompleteDto {
  @ApiProperty({ description: 'ID da aula' })
  @IsUUID()
  lessonId: string;

  @ApiProperty({ description: 'Tempo final do vídeo em segundos' })
  @IsNumber()
  @Min(0)
  finalTime: number;

  @ApiProperty({ description: 'Total de segundos assistidos' })
  @IsNumber()
  @Min(0)
  totalWatched: number;
}
