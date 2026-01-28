import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class SettingsService {
  private s3Client: S3Client | null = null;
  private bucketName: string;
  private publicUrl: string;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.bucketName = this.configService.get('R2_BUCKET', 'motochefe-videos');
    this.publicUrl = this.configService.get('R2_PUBLIC_URL', '');

    const endpoint = this.configService.get('R2_ENDPOINT', '');
    const accessKeyId = this.configService.get('R2_ACCESS_KEY', '');
    const secretAccessKey = this.configService.get('R2_SECRET_KEY', '');

    if (endpoint && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        forcePathStyle: true, // Necessário para MinIO
      });
    }
  }

  /**
   * Busca as configurações do sistema (cria registro padrão se não existir)
   */
  async getSettings() {
    let settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: { id: 'default' },
      });
    }

    return settings;
  }

  /**
   * Atualiza as configurações do sistema
   */
  async updateSettings(dto: UpdateSettingsDto) {
    // Garante que o registro existe
    await this.getSettings();

    return this.prisma.systemSettings.update({
      where: { id: 'default' },
      data: {
        ...(dto.primaryColor && { primaryColor: dto.primaryColor }),
        ...(dto.secondaryColor && { secondaryColor: dto.secondaryColor }),
        ...(dto.loginBgType && { loginBgType: dto.loginBgType }),
        ...(dto.loginBgColor && { loginBgColor: dto.loginBgColor }),
        ...(dto.loginBgMediaUrl !== undefined && { loginBgMediaUrl: dto.loginBgMediaUrl }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      },
    });
  }

  /**
   * Gera URL pré-assinada para upload de mídia
   */
  async getUploadUrl(fileName: string, contentType: string, mediaType: 'logo' | 'background') {
    if (!this.s3Client) {
      throw new Error('Storage não configurado');
    }

    const extension = fileName.split('.').pop();
    const key = `settings/${mediaType}/${randomUUID()}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    const publicUrl = `${this.publicUrl}/${key}`;

    return { uploadUrl, publicUrl, key };
  }
}
