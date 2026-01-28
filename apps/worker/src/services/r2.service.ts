import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      endpoint: this.configService.get<string>('R2_ENDPOINT'),
      region: 'auto',
      credentials: {
        accessKeyId: this.configService.get<string>('R2_ACCESS_KEY') || '',
        secretAccessKey: this.configService.get<string>('R2_SECRET_KEY') || '',
      },
    });

    this.bucket = this.configService.get<string>('R2_BUCKET') || 'motochefe-videos';
    this.publicUrl = this.configService.get<string>('R2_PUBLIC_URL') || '';
  }

  async downloadFile(url: string, outputPath: string): Promise<void> {
    this.logger.log(`Downloading file from ${url}`);

    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
    });

    const writer = fs.createWriteStream(outputPath);

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on('finish', () => {
        this.logger.log('File downloaded successfully');
        resolve();
      });
      writer.on('error', reject);
    });
  }

  async uploadHLSOutput(
    lessonId: string,
    outputDir: string
  ): Promise<{ manifestUrl: string; thumbnailUrl: string }> {
    const version = Date.now(); // Use timestamp as version
    const baseKey = `videos/${lessonId}/v${version}`;

    // Get all files recursively
    const files = this.getFilesRecursively(outputDir);

    this.logger.log(`Uploading ${files.length} files to R2...`);

    for (const filePath of files) {
      const relativePath = path.relative(outputDir, filePath);
      const key = `${baseKey}/${relativePath}`;
      const contentType = this.getContentType(filePath);

      await this.uploadFile(filePath, key, contentType);
    }

    const manifestUrl = `${this.publicUrl}/${baseKey}/master.m3u8`;
    const thumbnailUrl = `${this.publicUrl}/${baseKey}/thumb.jpg`;

    this.logger.log(`HLS upload complete. Manifest: ${manifestUrl}`);

    return { manifestUrl, thumbnailUrl };
  }

  private async uploadFile(
    filePath: string,
    key: string,
    contentType: string
  ): Promise<void> {
    const fileStream = fs.createReadStream(filePath);
    const fileStats = fs.statSync(filePath);

    const upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: fileStream,
        ContentType: contentType,
        ContentLength: fileStats.size,
      },
    });

    await upload.done();
    this.logger.debug(`Uploaded: ${key}`);
  }

  private getFilesRecursively(dir: string): string[] {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.getFilesRecursively(fullPath));
      } else {
        files.push(fullPath);
      }
    }

    return files;
  }

  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.m3u8': 'application/vnd.apple.mpegurl',
      '.ts': 'video/mp2t',
      '.mp4': 'video/mp4',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };
    return contentTypes[ext] || 'application/octet-stream';
  }
}
