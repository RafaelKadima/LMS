import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { SendStatementDto } from './dto';
import {
  buildPlayedStatement,
  buildPausedStatement,
  buildSeekedStatement,
  buildCompletedStatement,
  XAPIStatement,
} from '@motochefe/shared';

@Injectable()
export class XAPIService {
  private readonly logger = new Logger(XAPIService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('xapi-outbox') private xapiQueue: Queue
  ) {}

  async queueStatement(user: any, dto: SendStatementDto) {
    const { verb, lessonId, lessonTitle, courseId, courseTitle, data } = dto;

    // Build statement based on verb
    const params = {
      userId: user.sub,
      userEmail: user.email,
      userName: user.name,
      lessonId,
      lessonTitle,
      courseId,
      courseTitle,
      franchiseId: user.franchiseId,
      storeId: user.storeId,
      cargo: user.cargo,
    };

    let statement: XAPIStatement;

    switch (verb) {
      case 'played':
        statement = buildPlayedStatement(params, data.currentTime!, data.duration!);
        break;
      case 'paused':
        statement = buildPausedStatement(params, data.currentTime!, data.duration!);
        break;
      case 'seeked':
        statement = buildSeekedStatement(params, data.timeFrom!, data.timeTo!, data.duration!);
        break;
      case 'completed':
        statement = buildCompletedStatement(params, data.duration!, data.totalWatched!);
        break;
      default:
        throw new Error(`Verbo desconhecido: ${verb}`);
    }

    // Save to outbox
    const event = await this.prisma.xAPIEvent.create({
      data: {
        userId: user.sub,
        statementJson: statement as any,
        status: 'pending',
      },
    });

    // Queue for async processing
    await this.xapiQueue.add(
      'send-statement',
      { eventId: event.id },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      }
    );

    this.logger.log(`Statement xAPI enfileirado: ${verb} para aula ${lessonId}`);

    return {
      accepted: true,
      eventId: event.id,
    };
  }
}
