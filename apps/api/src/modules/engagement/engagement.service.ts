import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEngagementEventDto, BatchEngagementEventDto } from './dto';

@Injectable()
export class EngagementService {
  constructor(private prisma: PrismaService) {}

  async createEvent(userId: string, dto: CreateEngagementEventDto) {
    return this.prisma.engagementEvent.create({
      data: {
        userId,
        courseId: dto.courseId,
        lessonId: dto.lessonId,
        eventType: dto.type,
        videoTime: dto.videoTime,
        metadata: dto.metadata,
        eventTimestamp: new Date(dto.timestamp),
      },
    });
  }

  async createBatch(userId: string, dto: BatchEngagementEventDto) {
    const data = dto.events.map((event) => ({
      userId,
      courseId: event.courseId,
      lessonId: event.lessonId,
      eventType: event.type,
      videoTime: event.videoTime,
      metadata: event.metadata,
      eventTimestamp: new Date(event.timestamp),
    }));

    return this.prisma.engagementEvent.createMany({ data });
  }

  async getReport(userId: string, courseId: string) {
    const events = await this.prisma.engagementEvent.findMany({
      where: { userId, courseId },
      orderBy: { eventTimestamp: 'asc' },
    });

    const pauseCount = events.filter((e) => e.eventType === 'video_paused_no_face').length;
    const faceDetectedEvents = events.filter((e) => e.eventType === 'face_detected');
    const faceLostEvents = events.filter((e) => e.eventType === 'face_lost');

    // Calcular tempo com rosto presente
    let totalPresenceSeconds = 0;
    let totalSessionSeconds = 0;

    const sessionStarts = events.filter((e) => e.eventType === 'session_start');
    const sessionEnds = events.filter((e) => e.eventType === 'session_end');

    for (let i = 0; i < sessionStarts.length; i++) {
      const start = sessionStarts[i].eventTimestamp;
      const end = sessionEnds[i]?.eventTimestamp || new Date();
      totalSessionSeconds += (end.getTime() - start.getTime()) / 1000;
    }

    // Calcular tempo de presença (entre face_detected e face_lost)
    for (let i = 0; i < faceDetectedEvents.length; i++) {
      const detected = faceDetectedEvents[i].eventTimestamp;
      const lost = faceLostEvents[i]?.eventTimestamp || sessionEnds[sessionEnds.length - 1]?.eventTimestamp || new Date();
      totalPresenceSeconds += (lost.getTime() - detected.getTime()) / 1000;
    }

    const presenceRate = totalSessionSeconds > 0
      ? Math.round((totalPresenceSeconds / totalSessionSeconds) * 100)
      : 0;

    return {
      events,
      stats: {
        totalWatchTime: Math.round(totalPresenceSeconds),
        totalSessionTime: Math.round(totalSessionSeconds),
        pauseCount,
        presenceRate: Math.min(100, presenceRate),
        faceDetections: faceDetectedEvents.length,
        faceLosses: faceLostEvents.length,
      },
    };
  }

  async getLessonReport(userId: string, lessonId: string) {
    const events = await this.prisma.engagementEvent.findMany({
      where: { userId, lessonId },
      orderBy: { eventTimestamp: 'asc' },
    });

    const pauseCount = events.filter((e) => e.eventType === 'video_paused_no_face').length;

    return {
      events,
      stats: {
        pauseCount,
        totalEvents: events.length,
      },
    };
  }
}
