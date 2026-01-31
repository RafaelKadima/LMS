import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMeetingDto, UpdateMeetingDto } from './dto';
import { MeetingStatus, NotificationType, ParticipantStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

@Injectable()
export class MeetingsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  private generateJitsiRoomName(): string {
    return `motochefe-${randomUUID().slice(0, 8)}`;
  }

  private async resolveParticipantIds(
    scope: string,
    franchiseId?: string,
    storeId?: string,
    participantIds?: string[],
  ): Promise<string[]> {
    switch (scope) {
      case 'broadcast':
        const allUsers = await this.prisma.user.findMany({
          where: { isActive: true },
          select: { id: true },
        });
        return allUsers.map((u) => u.id);

      case 'franchise':
        if (!franchiseId) throw new BadRequestException('franchiseId é obrigatório para scope=franchise');
        const franchiseUsers = await this.prisma.user.findMany({
          where: { franchiseId, isActive: true },
          select: { id: true },
        });
        return franchiseUsers.map((u) => u.id);

      case 'store':
        if (!storeId) throw new BadRequestException('storeId é obrigatório para scope=store');
        const storeUsers = await this.prisma.user.findMany({
          where: { storeId, isActive: true },
          select: { id: true },
        });
        return storeUsers.map((u) => u.id);

      case 'manual':
        if (!participantIds?.length) throw new BadRequestException('participantIds é obrigatório para scope=manual');
        return participantIds;

      default:
        return [];
    }
  }

  async create(dto: CreateMeetingDto, createdById: string) {
    const userIds = await this.resolveParticipantIds(
      dto.scope,
      dto.franchiseId,
      dto.storeId,
      dto.participantIds,
    );

    // Ensure creator is included
    if (!userIds.includes(createdById)) {
      userIds.push(createdById);
    }

    const meeting = await this.prisma.meeting.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: dto.type as any,
        scheduledAt: new Date(dto.scheduledAt),
        durationMinutes: dto.durationMinutes || 60,
        jitsiRoomName: this.generateJitsiRoomName(),
        scope: dto.scope as any,
        franchiseId: dto.franchiseId,
        storeId: dto.storeId,
        createdById,
        participants: {
          createMany: {
            data: userIds.map((userId) => ({
              userId,
              status: userId === createdById ? 'accepted' as ParticipantStatus : 'invited' as ParticipantStatus,
            })),
          },
        },
      },
      include: {
        participants: { include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    // Notify participants (exclude creator)
    const notifyIds = userIds.filter((id) => id !== createdById);
    if (notifyIds.length > 0) {
      const typeLabel = dto.type === 'seminar' ? 'Seminário' : dto.type === 'training' ? 'Treinamento' : 'Reunião';
      await this.notifications.createBulk(
        notifyIds,
        NotificationType.meeting_invite,
        `${typeLabel} agendada: ${dto.title}`,
        `Você foi convidado para "${dto.title}" em ${new Date(dto.scheduledAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`,
        { meetingId: meeting.id },
      );
    }

    return meeting;
  }

  async findAll(userId: string, role: string, filter?: 'upcoming' | 'past') {
    const isAdmin = role === 'super_admin' || role === 'franchise_admin';

    const where: any = {};
    if (!isAdmin) {
      where.participants = { some: { userId } };
    }

    if (filter === 'upcoming') {
      where.scheduledAt = { gte: new Date() };
      where.status = { in: ['scheduled', 'live'] };
    } else if (filter === 'past') {
      where.OR = [
        { status: { in: ['ended', 'cancelled'] } },
        { scheduledAt: { lt: new Date() }, status: 'scheduled' },
      ];
    }

    const meetings = await this.prisma.meeting.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { participants: true } },
        participants: userId
          ? {
              where: { userId },
              select: { status: true },
              take: 1,
            }
          : false,
      },
      orderBy: { scheduledAt: filter === 'past' ? 'desc' : 'asc' },
    });

    return meetings.map((m) => ({
      ...m,
      myStatus: m.participants?.[0]?.status || null,
      participants: undefined,
    }));
  }

  async findAllAdmin(page = 1, perPage = 20, search?: string) {
    const skip = (page - 1) * perPage;
    const where: any = {};
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true } },
          franchise: { select: { id: true, name: true } },
          store: { select: { id: true, name: true } },
          _count: { select: { participants: true } },
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: perPage,
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return { data, total, page, perPage };
  }

  async findOne(id: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true, avatarUrl: true } },
        franchise: { select: { id: true, name: true } },
        store: { select: { id: true, name: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
          },
          orderBy: { user: { name: 'asc' } },
        },
      },
    });

    if (!meeting) throw new NotFoundException('Reunião não encontrada');

    return meeting;
  }

  async update(id: string, dto: UpdateMeetingDto, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id } });
    if (!meeting) throw new NotFoundException('Reunião não encontrada');
    if (meeting.createdById !== userId) throw new ForbiddenException('Apenas o criador pode editar');

    const data: Record<string, any> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.scheduledAt !== undefined) data.scheduledAt = new Date(dto.scheduledAt);
    if (dto.durationMinutes !== undefined) data.durationMinutes = dto.durationMinutes;

    return this.prisma.meeting.update({
      where: { id },
      data,
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { participants: true } },
      },
    });
  }

  async delete(id: string, userId: string, role: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: { participants: { select: { userId: true } } },
    });
    if (!meeting) throw new NotFoundException('Reunião não encontrada');

    const isAdmin = role === 'super_admin';
    if (meeting.createdById !== userId && !isAdmin) {
      throw new ForbiddenException('Sem permissão para excluir');
    }

    // Notify participants about cancellation
    const participantIds = meeting.participants
      .map((p) => p.userId)
      .filter((id) => id !== userId);

    if (participantIds.length > 0) {
      await this.notifications.createBulk(
        participantIds,
        NotificationType.meeting_cancelled,
        `Reunião cancelada: ${meeting.title}`,
        `A reunião "${meeting.title}" foi cancelada.`,
        { meetingId: meeting.id },
      );
    }

    await this.prisma.meeting.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    return { deleted: true };
  }

  async respond(meetingId: string, userId: string, response: 'accepted' | 'declined') {
    const participant = await this.prisma.meetingParticipant.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });
    if (!participant) throw new NotFoundException('Você não é participante desta reunião');

    return this.prisma.meetingParticipant.update({
      where: { id: participant.id },
      data: { status: response as ParticipantStatus },
    });
  }

  async join(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        participants: {
          where: { userId },
        },
      },
    });

    if (!meeting) throw new NotFoundException('Reunião não encontrada');
    if (!meeting.participants.length) throw new ForbiddenException('Você não é participante desta reunião');

    // Update participant join time
    await this.prisma.meetingParticipant.update({
      where: { id: meeting.participants[0].id },
      data: { joinedAt: new Date(), status: 'attended' },
    });

    return {
      jitsiRoomName: meeting.jitsiRoomName,
      meetingTitle: meeting.title,
    };
  }

  async leave(meetingId: string, userId: string) {
    const participant = await this.prisma.meetingParticipant.findUnique({
      where: { meetingId_userId: { meetingId, userId } },
    });
    if (!participant) throw new NotFoundException('Participante não encontrado');

    await this.prisma.meetingParticipant.update({
      where: { id: participant.id },
      data: { leftAt: new Date() },
    });

    return { success: true };
  }

  async start(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { participants: { select: { userId: true } } },
    });
    if (!meeting) throw new NotFoundException('Reunião não encontrada');
    if (meeting.createdById !== userId) throw new ForbiddenException('Apenas o criador pode iniciar');

    await this.prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'live' },
    });

    // Notify participants
    const notifyIds = meeting.participants
      .map((p) => p.userId)
      .filter((id) => id !== userId);

    if (notifyIds.length > 0) {
      await this.notifications.createBulk(
        notifyIds,
        NotificationType.meeting_started,
        `Reunião iniciada: ${meeting.title}`,
        `"${meeting.title}" começou! Clique para entrar.`,
        { meetingId },
      );
    }

    return { status: 'live' };
  }

  async end(meetingId: string, userId: string) {
    const meeting = await this.prisma.meeting.findUnique({ where: { id: meetingId } });
    if (!meeting) throw new NotFoundException('Reunião não encontrada');
    if (meeting.createdById !== userId) throw new ForbiddenException('Apenas o criador pode encerrar');

    await this.prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'ended' },
    });

    return { status: 'ended' };
  }
}
