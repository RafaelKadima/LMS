import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';

@Injectable()
export class FFmpegService {
  private readonly logger = new Logger(FFmpegService.name);

  constructor(private configService: ConfigService) {
    const ffmpegPath = this.configService.get<string>('FFMPEG_PATH');
    const ffprobePath = this.configService.get<string>('FFPROBE_PATH');

    if (ffmpegPath) {
      ffmpeg.setFfmpegPath(ffmpegPath);
    }
    if (ffprobePath) {
      ffmpeg.setFfprobePath(ffprobePath);
    }
  }

  async getDuration(inputPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(inputPath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(metadata.format.duration || 0);
      });
    });
  }

  async transcodeToHLS(
    inputPath: string,
    outputDir: string,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const qualities = [
      { name: '360p', width: 640, height: 360, bitrate: '600k', audioBitrate: '64k' },
      { name: '480p', width: 854, height: 480, bitrate: '1200k', audioBitrate: '96k' },
      { name: '720p', width: 1280, height: 720, bitrate: '2500k', audioBitrate: '128k' },
    ];

    // Get video duration for progress calculation
    const duration = await this.getDuration(inputPath);

    // Transcode each quality
    for (let i = 0; i < qualities.length; i++) {
      const quality = qualities[i];
      const qualityDir = path.join(outputDir, quality.name);

      this.logger.log(`Transcoding ${quality.name}...`);

      await this.transcodeQuality(
        inputPath,
        qualityDir,
        quality,
        duration,
        (progress) => {
          // Calculate overall progress across all qualities
          const qualityProgress = (i + progress) / qualities.length;
          onProgress?.(qualityProgress);
        }
      );
    }

    // Generate master playlist
    await this.generateMasterPlaylist(outputDir, qualities);
  }

  private async transcodeQuality(
    inputPath: string,
    outputDir: string,
    quality: { name: string; width: number; height: number; bitrate: string; audioBitrate: string },
    duration: number,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const { mkdirSync } = await import('fs');
    mkdirSync(outputDir, { recursive: true });

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-vf scale=${quality.width}:${quality.height}:force_original_aspect_ratio=decrease,pad=${quality.width}:${quality.height}:(ow-iw)/2:(oh-ih)/2`,
          `-c:v libx264`,
          `-preset fast`,
          `-b:v ${quality.bitrate}`,
          `-maxrate ${quality.bitrate}`,
          `-bufsize ${parseInt(quality.bitrate) * 2}k`,
          `-c:a aac`,
          `-b:a ${quality.audioBitrate}`,
          `-hls_time 6`,
          `-hls_list_size 0`,
          `-hls_segment_filename ${outputDir}/segment_%03d.ts`,
          `-f hls`,
        ])
        .output(`${outputDir}/playlist.m3u8`)
        .on('progress', (progress) => {
          if (progress.timemark) {
            const [h, m, s] = progress.timemark.split(':').map(parseFloat);
            const currentTime = h * 3600 + m * 60 + s;
            const progressPercent = Math.min(currentTime / duration, 1);
            onProgress?.(progressPercent);
          }
        })
        .on('end', () => {
          this.logger.log(`${quality.name} transcoding complete`);
          resolve();
        })
        .on('error', (err) => {
          this.logger.error(`${quality.name} transcoding failed:`, err);
          reject(err);
        })
        .run();
    });
  }

  private async generateMasterPlaylist(
    outputDir: string,
    qualities: { name: string; width: number; height: number; bitrate: string }[]
  ): Promise<void> {
    const { writeFileSync } = await import('fs');

    let masterPlaylist = '#EXTM3U\n#EXT-X-VERSION:3\n\n';

    for (const quality of qualities) {
      const bandwidth = parseInt(quality.bitrate) * 1000;
      masterPlaylist += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${quality.width}x${quality.height}\n`;
      masterPlaylist += `${quality.name}/playlist.m3u8\n\n`;
    }

    writeFileSync(path.join(outputDir, 'master.m3u8'), masterPlaylist);
    this.logger.log('Master playlist generated');
  }

  async generateThumbnail(inputPath: string, outputPath: string): Promise<void> {
    const duration = await this.getDuration(inputPath);
    const timestamp = Math.min(5, duration / 4); // 5s or 25% of video, whichever is less

    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          timestamps: [timestamp],
          filename: 'thumb.jpg',
          folder: path.dirname(outputPath),
          size: '640x360',
        })
        .on('end', () => {
          this.logger.log('Thumbnail generated');
          resolve();
        })
        .on('error', (err) => {
          this.logger.error('Thumbnail generation failed:', err);
          reject(err);
        });
    });
  }
}
