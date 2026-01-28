import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { FFmpegService } from '../services/ffmpeg.service';
import { R2Service } from '../services/r2.service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface VideoJobData {
  jobId: string;
  lessonId: string;
  sourceUrl: string;
}

@Processor('video-processing')
export class VideoProcessor extends WorkerHost {
  private readonly logger = new Logger(VideoProcessor.name);

  constructor(
    private prisma: PrismaService,
    private ffmpeg: FFmpegService,
    private r2: R2Service
  ) {
    super();
  }

  async process(job: Job<VideoJobData>) {
    const { jobId, lessonId, sourceUrl } = job.data;

    this.logger.log(`Processando vídeo para aula ${lessonId}`);

    const tempDir = path.join(os.tmpdir(), `video-${jobId}`);
    const inputPath = path.join(tempDir, 'input.mp4');
    const outputDir = path.join(tempDir, 'output');

    try {
      // Atualiza status do job
      await this.updateJobStatus(jobId, 'processing', 0);
      await this.updateLessonStatus(lessonId, 'processing');

      // Cria diretórios temporários
      fs.mkdirSync(tempDir, { recursive: true });
      fs.mkdirSync(outputDir, { recursive: true });

      // Baixa vídeo original
      await job.updateProgress(10);
      this.logger.log(`Baixando vídeo original de ${sourceUrl}`);
      await this.r2.downloadFile(sourceUrl, inputPath);

      // Obtém duração do vídeo
      await job.updateProgress(20);
      const duration = await this.ffmpeg.getDuration(inputPath);
      this.logger.log(`Duração do vídeo: ${duration}s`);

      // Transcodifica para HLS
      await job.updateProgress(30);
      this.logger.log(`Transcodificando para HLS...`);
      await this.ffmpeg.transcodeToHLS(inputPath, outputDir, (progress) => {
        const overallProgress = 30 + Math.round(progress * 0.5); // 30-80%
        job.updateProgress(overallProgress);
        this.updateJobStatus(jobId, 'processing', overallProgress);
      });

      // Gera thumbnail
      await job.updateProgress(80);
      const thumbnailPath = path.join(outputDir, 'thumb.jpg');
      await this.ffmpeg.generateThumbnail(inputPath, thumbnailPath);

      // Faz upload de todos os arquivos para R2
      await job.updateProgress(85);
      this.logger.log(`Fazendo upload dos arquivos HLS para R2...`);
      const { manifestUrl, thumbnailUrl } = await this.r2.uploadHLSOutput(
        lessonId,
        outputDir
      );

      // Atualiza aula com URL do manifest
      await job.updateProgress(95);
      await this.prisma.lesson.update({
        where: { id: lessonId },
        data: {
          manifestUrl,
          thumbnailUrl,
          durationSeconds: Math.round(duration),
          processingStatus: 'completed',
        },
      });

      // Marca job como concluído
      await this.updateJobStatus(jobId, 'completed', 100);

      // Limpa arquivos temporários
      fs.rmSync(tempDir, { recursive: true, force: true });

      await job.updateProgress(100);
      this.logger.log(`Processamento de vídeo concluído para aula ${lessonId}`);

      return { success: true, manifestUrl, thumbnailUrl };
    } catch (error) {
      this.logger.error(`Processamento de vídeo falhou para aula ${lessonId}`, error);

      // Atualiza status como falhou
      await this.updateJobStatus(jobId, 'failed', 0, String(error));
      await this.updateLessonStatus(lessonId, 'failed');

      // Limpa arquivos temporários
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }

      throw error;
    }
  }

  private async updateJobStatus(
    jobId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    progress: number,
    errorMsg?: string
  ) {
    await this.prisma.videoJob.update({
      where: { id: jobId },
      data: {
        status,
        progress,
        errorMsg,
        startedAt: status === 'processing' ? new Date() : undefined,
        completedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
      },
    });
  }

  private async updateLessonStatus(
    lessonId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed'
  ) {
    await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { processingStatus: status },
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} falhou: ${error.message}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} concluído com sucesso`);
  }
}
