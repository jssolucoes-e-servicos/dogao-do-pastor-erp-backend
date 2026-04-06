import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/common/helpers/importer.helper';
import { CommandsGateway } from '../gateways/commands.gateway';

/**
 * Loteamento de comandas agendadas.
 *
 * Regras:
 * - Comandas com horário agendado nascem com status QUEUE
 * - 1h antes do lote (XX:00-XX:29 ou XX:30-XX:59), passam para PENDING
 * - Doações não resgatadas até 17h são puxadas automaticamente
 * - Comandas sem horário (balcão imediato) nascem direto como PENDING
 */
@Injectable()
export class CommandsBatchService {
  private readonly logger = new Logger(CommandsBatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: CommandsGateway,
  ) {}

  /**
   * Roda a cada minuto para verificar lotes que devem entrar em produção
   */
  @Cron('* * * * *')
  async processBatches() {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    // Lote atual: qual slot de 30min estamos 1h à frente?
    // Ex: agora 18:05 → slot alvo: 19:00-19:29
    // Ex: agora 18:35 → slot alvo: 19:30-19:59
    const targetHour = oneHourLater.getHours();
    const targetMinute = oneHourLater.getMinutes();
    const targetSlotStart = targetMinute < 30 ? 0 : 30;
    const targetSlotEnd = targetSlotStart === 0 ? 29 : 59;

    // Busca comandas QUEUE com horário no slot alvo
    const queued = await this.prisma.command.findMany({
      where: {
        status: 'QUEUE',
        active: true,
      },
      include: {
        order: { select: { deliveryTime: true, deliveryOption: true } },
        withdrawal: { select: { scheduledAt: true } },
      },
    });

    const toActivate: string[] = [];

    for (const cmd of queued) {
      const scheduledTime = this.getScheduledTime(cmd);
      if (!scheduledTime) {
        // Sem horário — ativa imediatamente
        toActivate.push(cmd.id);
        continue;
      }

      const [h, m] = scheduledTime.split(':').map(Number);
      if (
        h === targetHour &&
        m >= targetSlotStart &&
        m <= targetSlotEnd
      ) {
        toActivate.push(cmd.id);
      }

      // Menos de 1h para o horário — ativa direto
      const cmdDate = new Date(now);
      cmdDate.setHours(h, m, 0, 0);
      const diffMs = cmdDate.getTime() - now.getTime();
      if (diffMs > 0 && diffMs <= 60 * 60 * 1000) {
        if (!toActivate.includes(cmd.id)) toActivate.push(cmd.id);
      }
    }

    if (toActivate.length > 0) {
      await this.prisma.command.updateMany({
        where: { id: { in: toActivate } },
        data: { status: 'PENDING' },
      });
      this.logger.log(`Lote ativado: ${toActivate.length} comanda(s) → PENDING`);
      this.gateway.emitBatchActivated(toActivate.length);
    }

    // Doações não resgatadas até 17h
    await this.processDonationDeadline(now);
  }

  /**
   * Às 17h, puxar todas as doações QUEUE que ainda não foram para produção
   */
  private async processDonationDeadline(now: Date) {
    if (now.getHours() !== 17 || now.getMinutes() !== 0) return;

    const result = await this.prisma.command.updateMany({
      where: {
        status: 'QUEUE',
        active: true,
        withdrawalId: { not: null },
      },
      data: { status: 'PENDING' },
    });

    if (result.count > 0) {
      this.logger.log(`Deadline 17h: ${result.count} doação(ões) puxada(s) para produção`);
    }
  }

  /**
   * Puxar manualmente um lote específico (hora:slot)
   * slot: 'first' = XX:00-XX:29, 'second' = XX:30-XX:59
   */
  async pullBatch(hour: number, slot: 'first' | 'second'): Promise<number> {
    const slotStart = slot === 'first' ? 0 : 30;
    const slotEnd = slot === 'first' ? 29 : 59;

    const queued = await this.prisma.command.findMany({
      where: { status: 'QUEUE', active: true },
      include: {
        order: { select: { deliveryTime: true } },
        withdrawal: { select: { scheduledAt: true } },
      },
    });

    const toActivate = queued
      .filter((cmd) => {
        const t = this.getScheduledTime(cmd);
        if (!t) return false;
        const [h, m] = t.split(':').map(Number);
        return h === hour && m >= slotStart && m <= slotEnd;
      })
      .map((cmd) => cmd.id);

    if (toActivate.length > 0) {
      await this.prisma.command.updateMany({
        where: { id: { in: toActivate } },
        data: { status: 'PENDING' },
      });
    }

    return toActivate.length;
  }

  /**
   * Retorna o horário agendado de uma comanda (HH:MM)
   */
  private getScheduledTime(cmd: any): string | null {
    if (cmd.order?.deliveryTime) return cmd.order.deliveryTime;
    if (cmd.withdrawal?.scheduledAt) {
      const d = new Date(cmd.withdrawal.scheduledAt);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
    return null;
  }

  /**
   * Retorna resumo dos lotes pendentes agrupados por hora e slot
   */
  async getBatchSummary() {
    const queued = await this.prisma.command.findMany({
      where: { status: 'QUEUE', active: true },
      include: {
        order: { select: { deliveryTime: true, deliveryOption: true, customerName: true } },
        withdrawal: { select: { scheduledAt: true, partner: { select: { name: true } } } },
      },
    });

    const slots: Record<string, { label: string; count: number; commands: any[] }> = {};

    for (const cmd of queued) {
      const t = this.getScheduledTime(cmd);
      if (!t) {
        const key = 'imediato';
        if (!slots[key]) slots[key] = { label: 'Imediato', count: 0, commands: [] };
        slots[key].count++;
        slots[key].commands.push(cmd);
        continue;
      }
      const [h, m] = t.split(':').map(Number);
      const slot = m < 30 ? 'first' : 'second';
      const slotLabel = slot === 'first' ? `${String(h).padStart(2,'0')}:00-${String(h).padStart(2,'0')}:29` : `${String(h).padStart(2,'0')}:30-${String(h).padStart(2,'0')}:59`;
      const key = `${h}-${slot}`;
      if (!slots[key]) slots[key] = { label: slotLabel, count: 0, commands: [] };
      slots[key].count++;
      slots[key].commands.push(cmd);
    }

    return Object.entries(slots)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => ({ key, ...val }));
  }
}
