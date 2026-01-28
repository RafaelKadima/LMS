import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { VideoProcessor } from './processors/video.processor';
import { FFmpegService } from './services/ffmpeg.service';
import { R2Service } from './services/r2.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),

    BullModule.registerQueue({
      name: 'video-processing',
    }),

    PrismaModule,
  ],
  providers: [VideoProcessor, FFmpegService, R2Service],
})
export class AppModule {}
