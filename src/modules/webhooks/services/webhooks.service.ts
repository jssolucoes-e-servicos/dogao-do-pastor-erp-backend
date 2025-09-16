import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(private prisma: PrismaService) { }

  async handleMercadoPagoNotification(data: any) {
    console.log('Notificação do Mercado Pago recebida:', data);

    // A validação da assinatura do webhook deve ser implementada em produção

    // A lógica do Mercado Pago varia, mas você geralmente faria uma chamada para a API
    // para obter os detalhes completos do pagamento usando o ID da notificação.
    const paymentId = data.data.id;
    const topic = data.type;

    if (topic === 'payment') {
      // Aqui, você usaria o SDK do Mercado Pago para obter o status real.
      // Ex: const payment = await mercadopago.payment.get(paymentId);
      // Por simplicidade, assumiremos que a notificação é de um pagamento aprovado.
      const status = 'approved';

      if (status === 'approved') {
        const externalReference = 'ID_DO_PEDIDO_DA_NOTIFICACAO'; // Exemplo

        await this.prisma.preOrder.update({
          where: { id: externalReference },
          data: { paymentStatus: 'paid' },
        });

        console.log(`Pedido ${externalReference} atualizado para 'paid'.`);
      }
    }
  }
}
