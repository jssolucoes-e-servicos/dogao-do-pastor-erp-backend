import { Injectable } from '@nestjs/common';
import { MercadoPagoWebhookNotification } from 'src/common/interfaces/mp-types.interface';
import { MercadoPagoService } from 'src/modules/mercadopago/services/mercadopago.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private mercadoPagoService: MercadoPagoService,
  ) {
    /* void */
  }

  async handleMercadoPagoNotification(data: MercadoPagoWebhookNotification) {
    console.log('Notificação do Mercado Pago recebida:', data);

    const paymentId = data.data?.id;
    const topic = data.type;

    if (topic === 'payment' && paymentId) {
      try {
        const paymentDetails =
          await this.mercadoPagoService.getPaymentDetails(paymentId);

        const externalReference = paymentDetails.external_reference;
        const paymentStatus = paymentDetails.status;

        // Atualize o status do pedido no seu banco de dados
        await this.prisma.preOrder.update({
          where: { id: externalReference },
          data: { paymentStatus: paymentStatus as string },
        });

        console.log(
          `Pedido ${externalReference} atualizado para o status '${paymentStatus}'.`,
        );
      } catch (error) {
        console.error('Erro ao processar a notificação de pagamento:', error);
        // Não lance um erro aqui, apenas logue, para que o Mercado Pago
        // não tente reenviar a notificação repetidamente.
      }
    }
  }
}
