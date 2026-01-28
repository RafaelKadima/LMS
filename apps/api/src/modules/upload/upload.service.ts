import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RequestUploadDto, CompleteUploadDto } from './dto';

function generateId(): string {
  return randomUUID().replace(/-/g, '').slice(0, 16);
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    @InjectQueue('video-processing') private videoQueue: Queue
  ) {
    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('R2_ENDPOINT'),
      region: 'auto',
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY') || '',
        secretAccessKey: this.configService.get<string>('R2_SECRET_KEY') || '',
      },
    });

    this.bucket = this.configService.get<string>('R2_BUCKET') || 'motochefe-videos';
  }

  async generatePresignedUrl(dto: RequestUploadDto) {
    const { lessonId, fileName, contentType, fileSize } = dto;

    // Generate unique upload key
    const uploadId = generateId();
    const extension = fileName.split('.').pop();
    const key = `originals/${uploadId}.${extension}`;

    // Create presigned URL (valid for 1 hour)
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSize,
    });

    const presignedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 3600,
    });

    // Update lesson with pending status
    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        processingStatus: 'pending',
      },
    });

    this.logger.log(`URL assinada gerada para aula ${lessonId}`);

    return {
      uploadUrl: presignedUrl,
      key,
      uploadId,
      expiresIn: 3600,
    };
  }

  async initiateProcessing(dto: CompleteUploadDto) {
    const { lessonId, key, uploadId } = dto;

    const publicUrl = this.configService.get<string>('R2_PUBLIC_URL');
    const sourceUrl = `${publicUrl}/${key}`;

    // Create video job record
    const job = await this.prisma.videoJob.create({
      data: {
        lessonId,
        sourceUrl,
        status: 'pending',
      },
    });

    // Update lesson
    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        videoUrl: sourceUrl,
        processingStatus: 'processing',
      },
    });

    // Queue for processing
    await this.videoQueue.add(
      'transcode',
      {
        jobId: job.id,
        lessonId,
        sourceUrl,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      }
    );

    this.logger.log(`Processamento de vídeo enfileirado para aula ${lessonId}`);

    return {
      success: true,
      jobId: job.id,
      status: 'processing',
    };
  }
}
