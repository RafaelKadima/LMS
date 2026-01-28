import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Email do usuario', example: 'admin@motochefe.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Senha do usuario', example: '123456' })
  @IsString()
  @MinLength(6)
  password: string;
}
