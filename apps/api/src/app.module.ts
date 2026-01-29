import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';

// Modules
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { ProgressModule } from './modules/progress/progress.module';
import { XAPIModule } from './modules/xapi/xapi.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';
import { FranchisesModule } from './modules/franchises/franchises.module';
import { TracksModule } from './modules/tracks/tracks.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ModulesModule } from './modules/modules/modules.module';
import { BadgesModule } from './modules/badges/badges.module';
import { StoresModule } from './modules/stores/stores.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { SettingsModule } from './modules/settings/settings.module';
import { ReportsModule } from './modules/admin/reports/reports.module';
import { DriveModule } from './modules/drive/drive.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100,
      },
      {
        name: 'long',
        ttl: 3600000,
        limit: 1000,
      },
    ]),

    // Bull queues
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),

    // Application modules
    PrismaModule,
    AuthModule,
    CatalogModule,
    CoursesModule,
    LessonsModule,
    ProgressModule,
    XAPIModule,
    UploadModule,
    UsersModule,
    FranchisesModule,
    TracksModule,
    EnrollmentsModule,
    ModulesModule,
    BadgesModule,
    StoresModule,
    DashboardModule,
    GamificationModule,
    SettingsModule,
    ReportsModule,
    DriveModule,
  ],
})
export class AppModule {}
