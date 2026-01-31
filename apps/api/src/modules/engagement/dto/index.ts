import { IsString, IsUUID, IsNumber, IsOptional, IsDateString, IsObject, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEngagementEventDto {
  @ApiProperty({ description: 'Tipo do evento (session_start, face_detected, face_lost, video_paused_no_face, video_resumed_face_back, session_end, video_completed, camera_permission_denied)' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Timestamp do evento' })
  @IsDateString()
  timestamp: string;

  @ApiPropertyOptional({ description: 'Posição do vídeo no momento do evento' })
  @IsOptional()
  @IsNumber()
  videoTime?: number;

  @ApiProperty({ description: 'ID do curso' })
  @IsUUID()
  courseId: string;

  @ApiProperty({ description: 'ID da aula' })
  @IsUUID()
  lessonId: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class BatchEngagementEventDto {
  @ApiProperty({ type: [CreateEngagementEventDto], description: 'Lista de eventos de engajamento' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEngagementEventDto)
  events: CreateEngagementEventDto[];
}
