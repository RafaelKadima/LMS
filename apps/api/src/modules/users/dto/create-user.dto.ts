import { IsString, IsEmail, IsEnum, IsOptional, IsUUID, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, Cargo } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'joao@example.com', description: 'Email do usuário' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456', description: 'Senha do usuário (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'João Silva', description: 'Nome completo' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'uuid-da-franquia', description: 'ID da franquia' })
  @IsUUID()
  franchiseId: string;

  @ApiPropertyOptional({ example: 'uuid-da-loja', description: 'ID da loja (opcional)' })
  @IsUUID()
  @IsOptional()
  storeId?: string;

  @ApiProperty({ enum: Cargo, example: 'mecanico', description: 'Cargo do usuário' })
  @IsEnum(Cargo)
  cargo: Cargo;

  @ApiProperty({ enum: UserRole, example: 'learner', description: 'Role do usuário' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'URL do avatar' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
