import { Injectable, Logger } from '@nestjs/common';
import { fromPath } from 'pdf2pic';
import sharp from 'sharp';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, unlinkSync } from 'fs';

@Injectable()
export class PdfThumbnailService {
  private readonly logger = new Logger(PdfThumbnailService.name);
  private readonly thumbnailPath = join(
    process.cwd(),
    '..',
    'web',
    'public',
    'uploads',
    'lessons',
    'thumbnails',
  );

  constructor() {
    // Garantir que a pasta de thumbnails existe
    if (!existsSync(this.thumbnailPath)) {
      mkdirSync(this.thumbnailPath, { recursive: true });
    }
  }

  /**
   * Gera uma thumbnail da primeira página de um PDF
   * @param pdfPath Caminho completo para o arquivo PDF
   * @returns URL pública da thumbnail ou null em caso de erro
   */
  async generateThumbnail(pdfPath: string): Promise<string | null> {
    try {
      const uniqueId = randomUUID();

      // Definir PATH para encontrar o GraphicsMagick
      process.env.PATH = `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH}`;

      const options = {
        density: 100, // DPI - qualidade da renderização
        saveFilename: uniqueId,
        savePath: this.thumbnailPath,
        format: 'png' as const,
        width: 200, // Largura da thumbnail
        height: 280, // Altura proporcional A4
      };

      this.logger.log(`Gerando thumbnail para: ${pdfPath}`);

      const convert = fromPath(pdfPath, options);
      const result = await convert(1); // Página 1

      if (result.path) {
        // Otimizar com sharp - converter para WebP
        const optimizedFilename = `${uniqueId}.webp`;
        const optimizedPath = join(this.thumbnailPath, optimizedFilename);

        await sharp(result.path)
          .resize(200, 280, { fit: 'cover' })
          .webp({ quality: 80 })
          .toFile(optimizedPath);

        // Remover PNG original
        try {
          unlinkSync(result.path);
        } catch (e) {
          this.logger.warn(`Não foi possível remover PNG temporário: ${result.path}`);
        }

        const publicUrl = `/uploads/lessons/thumbnails/${optimizedFilename}`;
        this.logger.log(`Thumbnail gerada: ${publicUrl}`);

        return publicUrl;
      }

      return null;
    } catch (error) {
      this.logger.error(`Erro ao gerar thumbnail do PDF: ${error.message}`, error.stack);
      return null;
    }
  }
}
