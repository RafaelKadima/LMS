import { Module, forwardRef } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [forwardRef(() => GamificationModule)],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}
