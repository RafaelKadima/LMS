import { Module } from '@nestjs/common';
import { WebAuthnController } from './webauthn.controller';
import { WebAuthnService } from './webauthn.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WebAuthnController],
  providers: [WebAuthnService],
})
export class WebAuthnModule {}
