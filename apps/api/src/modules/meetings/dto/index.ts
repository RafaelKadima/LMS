import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  IsArray,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';

export class CreateMeetingDto {
  @ApiProperty({ description: 'Título da reunião' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['meeting', 'seminar', 'training'], default: 'meeting' })
  @IsEnum(['meeting', 'seminar', 'training'])
  type: 'meeting' | 'seminar' | 'training';

  @ApiProperty({ description: 'Data/hora agendada (ISO 8601)' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'Duração em minutos', default: 60 })
  @IsOptional()
  @IsInt()
  @Min(15)
  durationMinutes?: number;

  @ApiProperty({ enum: ['broadcast', 'franchise', 'store', 'manual'] })
  @IsEnum(['broadcast', 'franchise', 'store', 'manual'])
  scope: 'broadcast' | 'franchise' | 'store' | 'manual';

  @ApiPropertyOptional({ description: 'ID da franquia (quando scope=franchise)' })
  @IsOptional()
  @IsUUID()
  franchiseId?: string;

  @ApiPropertyOptional({ description: 'ID da loja (quando scope=store)' })
  @IsOptional()
  @IsUUID()
  storeId?: string;

  @ApiPropertyOptional({ description: 'IDs dos participantes (quando scope=manual)' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  participantIds?: string[];
}

export class UpdateMeetingDto extends PartialType(
  OmitType(CreateMeetingDto, ['scope', 'franchiseId', 'storeId', 'participantIds'] as const),
) {}

export class RespondMeetingDto {
  @ApiProperty({ enum: ['accepted', 'declined'] })
  @IsEnum(['accepted', 'declined'])
  response: 'accepted' | 'declined';
}
