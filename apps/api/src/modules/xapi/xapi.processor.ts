import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

@Processor('xapi-outbox')
export class XAPIProcessor extends WorkerHost {
  private readonly logger = new Logger(XAPIProcessor.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {
    super();
  }

  async process(job: Job<{ eventId: string }>) {
    const { eventId } = job.data;

    this.logger.log(`Processing xAPI event: ${eventId}`);

    const event = await this.prisma.xAPIEvent.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      this.logger.error(`Event not found: ${eventId}`);
      return;
    }

    if (event.status === 'sent') {
      this.logger.log(`Event already sent: ${eventId}`);
      return;
    }

    const lrsEndpoint = this.configService.get<string>('LRS_ENDPOINT');
    const lrsAuth = this.configService.get<string>('LRS_BASIC_AUTH');

    try {
      // Send to Learning Locker
      await axios.post(`${lrsEndpoint}/statements`, event.statementJson, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${lrsAuth}`,
          'X-Experience-API-Version': '1.0.3',
        },
        timeout: 10000,
      });

      // Mark as sent
      await this.prisma.xAPIEvent.update({
        where: { id: eventId },
        data: {
          status: 'sent',
          sentAt: new Date(),
          attempts: event.attempts + 1,
          lastAttemptAt: new Date(),
        },
      });

      this.logger.log(`xAPI statement sent successfully: ${eventId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await this.prisma.xAPIEvent.update({
        where: { id: eventId },
        data: {
          status: event.attempts >= 4 ? 'failed' : 'pending',
          attempts: event.attempts + 1,
          lastAttemptAt: new Date(),
          errorMessage,
        },
      });

      this.logger.error(`Failed to send xAPI statement: ${eventId}`, errorMessage);

      throw error; // Re-throw to trigger retry
    }
  }
}
