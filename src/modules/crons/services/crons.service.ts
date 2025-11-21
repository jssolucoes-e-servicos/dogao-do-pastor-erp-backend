// src/modules/crons/services/crons.service.ts
import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { CommandsService } from '@/modules/commands/services/commands.service';
import { EvolutionNotificationsService } from '@/modules/evolution/services/evolution-notifications.service';
import { PaymentTaskService } from '@/modules/payment/services/payment-task.service';
import { OrderReportService } from '@/modules/reports/services/order-report.service';
import { ReportsService } from '@/modules/reports/services/reports.service';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import path from 'path';
import { EvolutionService } from 'src/modules/evolution/services/evolution.service';

@Injectable()
export class CronsService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly evolutionService: EvolutionService,
    private readonly evolutionNotificationsService: EvolutionNotificationsService,
    private readonly paymentTaskService: PaymentTaskService,
    private readonly reportsService: ReportsService,
    private readonly orderReportService: OrderReportService,
    private readonly commandService: CommandsService,
  ) {
    super(loggerService, prismaService, configService);
  }

  @Cron('0 9 * * *', { timeZone: 'America/Sao_Paulo' })
  async handleDailyReport() {
    await this.reportsService.sendReportsIfChanged();
  }

  /*   //@Cron(CronExpression.EVERY_MINUTE)
  async processWhatsappMessages() {
    const penddings = await this.prisma.whatsappQueue.findMany();
    if (penddings) {
      //await this.evolutionService.sendText();
    }
  }
 */
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingPayments() {
    try {
      const pendents = await this.prisma.orderOnline.findMany({
        where: { paymentStatus: 'pending', status: 'pending_payment' },
      });

      if (pendents.length === 0) {
        return;
      }

      this.logger.log(`Encontrados ${pendents.length} pagamentos pendentes.`);

      for (const order of pendents) {
        const paymentId = order.paymentId;

        if (!paymentId) {
          this.logger.warn(
            `Pedido ${order.id} não possui mercadopagoPaymentId. Pulando.`,
          );
          continue;
        }
        //processamento
        await this.paymentTaskService.handlePendingPayments(order, paymentId);
      }

      this.logger.log(
        `Processamento finalizado, todos os pedidos fora conferidos`,
      );
    } catch (error) {
      this.logger.error(
        `Erro ao buscar pagamentos pendentes no banco de dados: ${error}`,
      );
    }
  }

  //@Cron(CronExpression.EVERY_MINUTE)
  async processNextCommand() {
    this.logger.log('Checking for next command to print...');

    const command = await this.commandService.findNextUnprinted();
    if (!command) {
      this.logger.log('No commands to process.');
      return;
    }

    this.logger.log(`Processing command: ${command.sequentialId}`);

    try {
      // Gera o PDF
      const pdfBuffer = await this.orderReportService.generateOrderPDFHtml(
        command.orderOnlineId,
      );

      // Salva o PDF (local ou MinIO)
      const fileName = `command_${command.sequentialId}.pdf`;
      const filePath = path.join(
        process.cwd(),
        'storage',
        'commands',
        fileName,
      );

      // Garante que o diretório existe
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, pdfBuffer);

      // Marca como impresso
      await this.commandService.markAsPrinted(command.id, filePath);

      // (Opcional) Envia por WhatsApp
      // await this.whatsappService.sendPDF(command.orderOnline.seller.phone, filePath);
      // await this.commandService.markAsSent(command.id);

      this.logger.log(
        `Command ${command.sequentialId} processed successfully.`,
      );
    } catch (error) {
      this.logger.error(
        `Error processing command ${command.sequentialId}: ${error}`,
      );
      // Pode implementar retry ou log de erro no banco
    }
  }

  //@Cron(CronExpression.EVERY_10_MINUTES)
  //@Cron('*/30 * * * * *') // a cada 30 segundos
  async fetchPaidDeliveryOrdersNeedingConfirmation() {
    console.log('validating paid delivery orders needing confirmation...');
    await this.evolutionNotificationsService.sendDeliveryConfirmationToCustomer();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async autoGenerateCommandsForPaidOrders() {
    const orders = await this.prisma.orderOnline.findMany({
      where: {
        paymentStatus: 'approved',
        deliveryOption: { in: ['delivery', 'scheduled'] },
        commands: { none: {} },
      },
    });

    let createdCount = 0;
    for (const order of orders) {
      await this.commandService.createCommand(order.id, 253); // ou editionCode correto
      createdCount++;
    }
    if (createdCount) {
      this.logger.log(
        `Geradas ${createdCount} comandas para pedidos com paymentStatus=approved e deliveryOption=delivery/scheduled`,
      );
    }
    return createdCount;
  }
}
