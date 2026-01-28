import { IsString, IsEmail, IsEnum, IsOptional, IsUUID, MinLength, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, Cargo } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'joao@example.com', description: 'Email do usuário' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'João Silva', description: 'Nome completo' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'uuid-da-franquia', description: 'ID da franquia' })
  @IsUUID()
  @IsOptional()
  franchiseId?: string;

  @ApiPropertyOptional({ example: 'uuid-da-loja', description: 'ID da loja' })
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @ApiPropertyOptional({ enum: Cargo, example: 'mecanico', description: 'Cargo do usuário' })
  @IsEnum(Cargo)
  @IsOptional()
  cargo?: Cargo;

  @ApiPropertyOptional({ enum: UserRole, example: 'learner', description: 'Role do usuário' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'URL do avatar' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: true, description: 'Se o usuário está ativo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class ResetPasswordDto {
  @ApiPropertyOptional({ example: 'novaSenha123', description: 'Nova senha (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  @IsOptional()
  newPassword?: string;
}
