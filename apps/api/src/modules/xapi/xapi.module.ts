import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { XAPIController } from './xapi.controller';
import { XAPIService } from './xapi.service';
import { XAPIProcessor } from './xapi.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'xapi-outbox',
    }),
  ],
  controllers: [XAPIController],
  providers: [XAPIService, XAPIProcessor],
  exports: [XAPIService],
})
export class XAPIModule {}
