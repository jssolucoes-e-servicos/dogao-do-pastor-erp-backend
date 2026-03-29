import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/common/helpers/importer.helper';
import {
  SendToContributorDto,
  SendToCellDto,
  SendToNetworkDto,
  SendToAllDto,
  UpdatePreferencesDto,
} from '../dto/send-notification.dto';

const SYSTEM_TYPE = 'SYSTEM';

interface PushPayload {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default';
  priority?: 'high' | 'normal';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Token management ──────────────────────────────────────────

  async registerToken(contributorId: string, token: string, platform: string) {
    return this.prisma.pushToken.upsert({
      where: { token },
      update: { contributorId, platform, active: true },
      create: { contributorId, token, platform },
    });
  }

  async removeToken(token: string) {
    return this.prisma.pushToken.updateMany({
      where: { token },
      data: { active: false },
    });
  }

  // ── Preferences ───────────────────────────────────────────────

  async getPreferences(contributorId: string) {
    return this.prisma.notificationPreference.upsert({
      where: { contributorId },
      update: {},
      create: { contributorId },
    });
  }

  async updatePreferences(contributorId: string, dto: UpdatePreferencesDto) {
    return this.prisma.notificationPreference.upsert({
      where: { contributorId },
      update: dto,
      create: { contributorId, ...dto },
    });
  }

  // ── Send helpers ──────────────────────────────────────────────

  async sendToContributor(dto: SendToContributorDto) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { contributorId: dto.contributorId, active: true },
    });

    // Verificar preferências (SYSTEM sempre passa)
    if (dto.type !== SYSTEM_TYPE) {
      const prefs = await this.getPreferences(dto.contributorId);
      const key = dto.type.toLowerCase() as keyof typeof prefs;
      if (prefs[key] === false) return { sent: 0, skipped: 1 };
    }

    return this.dispatch(tokens.map(t => t.token), dto);
  }

  async sendToCell(dto: SendToCellDto) {
    const sellers = await this.prisma.seller.findMany({
      where: { cellId: dto.cellId, active: true },
      select: { contributorId: true },
    });
    const ids = sellers.map(s => s.contributorId);
    return this.sendToContributors(ids, dto);
  }

  async sendToNetwork(dto: SendToNetworkDto) {
    const cells = await this.prisma.cell.findMany({
      where: { networkId: dto.networkId, active: true },
      select: { id: true },
    });
    const cellIds = cells.map(c => c.id);
    const sellers = await this.prisma.seller.findMany({
      where: { cellId: { in: cellIds }, active: true },
      select: { contributorId: true },
    });
    const ids = [...new Set(sellers.map(s => s.contributorId))];
    return this.sendToContributors(ids, dto);
  }

  async sendToAll(dto: SendToAllDto) {
    const tokens = await this.prisma.pushToken.findMany({
      where: { active: true },
    });

    // Para SYSTEM, ignora preferências
    if (dto.type === SYSTEM_TYPE) {
      return this.dispatch(tokens.map(t => t.token), dto);
    }

    // Para outros tipos, filtra por preferência
    const prefKey = dto.type.toLowerCase() as string;
    const prefs = await this.prisma.notificationPreference.findMany({
      where: { [prefKey]: false },
      select: { contributorId: true },
    });
    const optedOut = new Set(prefs.map(p => p.contributorId));

    const filtered = tokens
      .filter(t => !optedOut.has(t.contributorId))
      .map(t => t.token);

    return this.dispatch(filtered, dto);
  }

  // ── Internal ──────────────────────────────────────────────────

  private async sendToContributors(
    contributorIds: string[],
    dto: Omit<SendToContributorDto, 'contributorId'>,
  ) {
    if (!contributorIds.length) return { sent: 0, skipped: 0 };

    const tokens = await this.prisma.pushToken.findMany({
      where: { contributorId: { in: contributorIds }, active: true },
    });

    return this.dispatch(tokens.map(t => t.token), dto);
  }

  private async dispatch(
    tokens: string[],
    payload: { title: string; body: string; data?: Record<string, any>; type: string },
  ) {
    if (!tokens.length) return { sent: 0, skipped: 0 };

    const messages: PushPayload[] = tokens.map(token => ({
      to: token,
      title: payload.title,
      body: payload.body,
      data: payload.data,
      sound: 'default',
      priority: 'high',
    }));

    // Expo Push API — chunks de 100
    const chunks = this.chunkArray(messages, 100);
    let sent = 0;
    let errors = 0;

    for (const chunk of chunks) {
      try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(chunk),
        });
        const json = await res.json() as any;
        const results = Array.isArray(json.data) ? json.data : [json];
        sent += results.filter((r: any) => r.status === 'ok').length;
        errors += results.filter((r: any) => r.status !== 'ok').length;
      } catch (e) {
        this.logger.error('Push dispatch error', e);
        errors += chunk.length;
      }
    }

    // Log
    await this.prisma.notificationLog.create({
      data: {
        type: payload.type as any,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        success: errors === 0,
        error: errors > 0 ? `${errors} falhas` : null,
      },
    });

    return { sent, errors };
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size),
    );
  }

  async getLogs(limit = 50) {
    return this.prisma.notificationLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: limit,
    });
  }
}
