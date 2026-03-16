import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { GenerateOrderCardDTO } from '../dto/generate-order-card.dto';
import { GenerateOrderPixDTO } from '../dto/generate-order-pix.dto';
import { PaymentsService } from '../services/payments.service';
import { PaymentsTasksService } from '../services/payments-tasks.service';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PaymentsController {
  constructor(
    private readonly service: PaymentsService,
    private readonly tasksService: PaymentsTasksService
  ) {
    /* void */
  }

  @Post('create-order-pix')
  @Public()
  async CreateOrderPIX(@Body() dto: GenerateOrderPixDTO) {
    return this.service.CreateOrderPIX(dto);
  }

  @Post('create-order-card')
  @Public()
  async CreateOrderCard(@Body() dto: GenerateOrderCardDTO) {
    return this.service.CreateOrderCard(dto);
  }

  @Post('webhook')
  @HttpCode(200)
  @Public()
  async handleWebhook(@Body() body: any) {
    // Agora o N8N recebe o evento do MercadoPago puro e repassa apenas o providerPaymentId pra nós!
    const providerEventId = body?.data?.id || body?.id;

    if (providerEventId) {
      console.log(`[Webhook N8N -> NestJS] Recebido pagamento MP ID: ${providerEventId}`);
      const paymentParams = await this.service.findOne({
        providerPaymentId: String(providerEventId),
      });

      if (paymentParams) {
        await this.tasksService.handlePendingPayments(paymentParams as any);
      }
    }
    
    // Sempre retornar 200 OK
    return { received: true };
  }

  @Post('process-pending')
  @HttpCode(200)
  @Public()
  async processPendingPayments() {
    console.log('[Cron N8N -> NestJS] Iniciando rotina de varredura de pagamentos pendentes...');
    await this.tasksService.processPendingPayments();
    return { success: true };
  }
}
