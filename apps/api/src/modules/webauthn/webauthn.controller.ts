import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsOptional, IsString, Allow } from 'class-validator';
import { WebAuthnService } from './webauthn.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class RegistrationVerifyDto {
  @Allow()
  response: any;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

class AuthenticationOptionsDto {
  @IsOptional()
  @IsString()
  email?: string;
}

class AuthenticationVerifyDto {
  @IsString()
  sessionId: string;

  @Allow()
  response: any;
}

class RenameCredentialDto {
  @IsString()
  deviceName: string;
}

@ApiTags('webauthn')
@Controller('webauthn')
@UsePipes(new ValidationPipe({ whitelist: false, transform: true }))
export class WebAuthnController {
  constructor(
    private readonly webAuthnService: WebAuthnService,
    private readonly authService: AuthService,
  ) {}

  // --- Registration (requires auth) ---

  @Post('register/options')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Gerar opcoes para registro de passkey' })
  async getRegistrationOptions(@CurrentUser() user: any) {
    return this.webAuthnService.generateRegistrationOptions(user.sub);
  }

  @Post('register/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar e salvar passkey registrada' })
  async verifyRegistration(
    @CurrentUser() user: any,
    @Body() body: RegistrationVerifyDto,
  ) {
    return this.webAuthnService.verifyRegistration(
      user.sub,
      body.response,
      body.deviceName,
    );
  }

  // --- Authentication (public) ---

  @Post('authenticate/options')
  @ApiOperation({ summary: 'Gerar opcoes para autenticacao com passkey' })
  async getAuthenticationOptions(@Body() body: AuthenticationOptionsDto) {
    return this.webAuthnService.generateAuthenticationOptions(body?.email);
  }

  @Post('authenticate/verify')
  @ApiOperation({ summary: 'Verificar autenticacao com passkey e retornar JWT' })
  async verifyAuthentication(@Body() body: AuthenticationVerifyDto) {
    const { userId } = await this.webAuthnService.verifyAuthentication(
      body.sessionId,
      body.response,
    );
    return this.authService.generateTokenForUser(userId);
  }

  // --- Credential management (requires auth) ---

  @Get('credentials')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar passkeys do usuario' })
  async listCredentials(@CurrentUser() user: any) {
    return this.webAuthnService.listCredentials(user.sub);
  }

  @Delete('credentials/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover passkey' })
  async deleteCredential(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.webAuthnService.deleteCredential(user.sub, id);
  }

  @Patch('credentials/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renomear passkey' })
  async renameCredential(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: RenameCredentialDto,
  ) {
    return this.webAuthnService.renameCredential(user.sub, id, body.deviceName);
  }
}
