import { Module } from '@nestjs/common';
import { LessonsController } from './lessons.controller';
import { LessonsService } from './lessons.service';
import { PdfThumbnailService } from './pdf-thumbnail.service';

@Module({
  controllers: [LessonsController],
  providers: [LessonsService, PdfThumbnailService],
  exports: [LessonsService],
})
export class LessonsModule {}
