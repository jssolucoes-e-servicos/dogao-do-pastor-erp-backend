// src/modules/evolution/services/evolution-notifications.service.ts (Novo Serviço)

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseService } from 'src/common/services/base.service';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { SellerReportCache } from 'src/modules/reports/interfaces/SellerReportCache.interface';
import { EvolutionService } from './evolution.service'; // Injeta o serviço de API

@Injectable()
export class EvolutionNotificationsService extends BaseService {
  private readonly LOCATION_LATITUDE = -30.1146;
  private readonly LOCATION_LONGITUDE = -51.1281;
  private readonly LOCATION_NAME = 'Igreja Viva em Células';
  private readonly LOCATION_ADDRESS =
    'Avenida Dr. João Dentice, 241, Restinga, Porto Alegre/RS';

  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    // Injeta o serviço responsável pela comunicação HTTP
    private readonly evolutionService: EvolutionService,
  ) {
    super(loggerService, prismaService, configService);
  }

  // Método interno para envio de localização, utilizando os dados fixos
  async sendLocationNotification(phone: string) {
    return await this.evolutionService.sendLocation(
      phone,
      this.LOCATION_LATITUDE,
      this.LOCATION_LONGITUDE,
      this.LOCATION_NAME,
      this.LOCATION_ADDRESS,
    );
  }

  async sendWelcomeMessage(
    client: any,
    producaoAtiva: boolean,
    dataProducao?: string,
    horarioFechamento?: string,
  ) {
    let message = `🌭 *Dogão do Pastor* 🌭\n\nOlá ${client.name || client.nome}! Seu voucher foi validado com sucesso!\n\n`;

    if (producaoAtiva && dataProducao && horarioFechamento) {
      message += `📍 *Instruções para retirada:*\n`;
      message += `• Local: ${this.LOCATION_NAME}\n`;
      message += `• Endereço: ${this.LOCATION_ADDRESS}\n`;
      message += `• Data: ${new Date(dataProducao).toLocaleDateString('pt-BR')}\n`;
      message += `• Horário: Até às ${horarioFechamento}\n`;
      message += `• Apresente este voucher no local\n\n`;
      message += `⚠️ *Importante:* Você receberá um lembrete 1 hora antes do fechamento.\n\n`;
    } else {
      message += `⚠️ *Produção Encerrada*\n\n`;
      message += `A produção de hoje já foi encerrada, mas não se preocupe!\n`;
      message += `Guarde seu voucher para usar na próxima edição.\n`;
      message += `Você receberá a data da próxima edição em breve.\n\n`;
    }

    message += `Deus abençoe! 🙏`;

    const phone = client.phone || client.telefone;
    this.logger.log(`Enviando mensagem de boas-vindas para: ${phone}`);

    const result = await this.evolutionService.sendText(phone, message);

    // Enviar localização como segunda mensagem
    if (producaoAtiva) {
      await this.sendLocationNotification(phone);
    }

    return result;
  }

  async sendPurchaseConfirmation(
    customerName: string,
    phone: string,
    quantity: number,
    totalValue: number,
    isVoucher: boolean = false, // Adicionando isVoucher (se vier do contexto)
    isTelevendas = false,
  ) {
    // Se isVoucher for true, a mensagem é ligeiramente diferente (ou deveria ser)
    // Se for uma compra normal:

    let message = `🌭 *Dogão do Pastor* 🌭\n\nOlá ${customerName}!\n\nSeu pedido foi realizado com sucesso!\n\n📋 *Detalhes do Pedido:*\n• Quantidade: ${quantity}x Dogão do Pastor\n• Valor Total: R$ ${totalValue.toFixed(2)}\n\n`;

    if (isTelevendas) {
      message += `🚚 *Entrega:*\nSeu pedido será entregue em sua casa.\nPrevisão: 15 a 40 minutos\n\nVocê receberá uma mensagem quando o pedido sair para entrega.\n\n`;
    } else {
      message += `⏰ *Próximos Passos:*\nEm breve você será chamado pelo nome na recepção para retirar seu pedido.\n\n`;
    }

    message += `Obrigado pela preferência! 🙏`;

    this.logger.log(`Enviando confirmação de compra para: ${phone}`);

    return await this.evolutionService.sendText(phone, message);
  }

  async sendVoucherRedeemConfirmation(customerName: string, phone: string) {
    const message = `🌭 *Dogão do Pastor* 🌭\n\nOlá ${customerName}!\n\nSeu voucher foi resgatado com sucesso!\n\n⏰ *Próximos Passos:*\nEm breve você será chamado pelo nome na recepção para retirar seu dogão.\n\nObrigado! 🙏`;

    this.logger.log(`Enviando confirmação de resgate para: ${phone}`);

    return await this.evolutionService.sendText(phone, message);
  }

  async sendDeliveryNotification(
    customerName: string,
    phone: string,
    orderNumber: string,
    deliveryPersonName: string,
  ) {
    const message = `🚚 *Dogão do Pastor - Entrega* 🚚\n\nOlá ${customerName}!\n\nSeu pedido #${orderNumber} saiu para entrega!\n\n👤 *Entregador:* ${deliveryPersonName}\n⏰ *Previsão:* 15 a 40 minutos\n\nEm breve você receberá seu pedido!\n\nObrigado! 🙏`;

    this.logger.log(`Enviando notificação de entrega para: ${phone}`);

    return await this.evolutionService.sendText(phone, message);
  }

  async sendDeliveryInstructions(deliveryPersonPhone: string, orders: any[]) {
    let message = `🚚 *Dogão do Pastor - Entregas* 🚚\n\nVocê tem ${orders.length} entrega(s) para fazer:\n\n`;

    orders.forEach((order, index) => {
      message += `📦 *Pedido #${order.orderNumber}*\n`;
      message += `👤 Cliente: ${order.customerName}\n`;
      message += `📞 Telefone: ${order.customerPhone}\n`;
      message += `📍 Endereço: ${order.customerAddress}\n`;
      // Corrigindo o erro de sintaxe do link para Maps:
      message += `🗺️ Maps: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customerAddress)}\n\n`;
    });

    message += `Boa entrega! 🙏`;

    this.logger.log(
      `Enviando instruções de entrega para: ${deliveryPersonPhone}`,
    );

    return await this.evolutionService.sendText(deliveryPersonPhone, message);
  }

  async sendDeliveryPersonRegister(
    deliveryPersonPhone: string,
    deliveryPersonName: string,
  ) {
    let message = `🚚 *Dogão do Pastor - Cadastro de Entregador* 🚚\n\nOlá ${deliveryPersonName}, você foi cadastrado como entregador em nossa plataforma.\n\n`;

    message += `Quando uma nova rota for atribuida você receberá em seu whatsapp os dados de suas entregas.\n\n`;

    message += `Boas entregas! 🙏`;

    this.logger.log(
      `Enviando confirmação de cadastro de entregador para: ${deliveryPersonPhone}`,
    );

    return await this.evolutionService.sendText(deliveryPersonPhone, message);
  }

  sendEntryAnalysis(
    phone: string,
    preorderId: string,
    customerName: string | null,
    cpf: string | null,
    distance: string,
    addressInline: string,
  ) {
    let message = `🚚 *Dogão do Pastor - Solicitação de Analise* 🚚\n\nOlá, temos um novo pedido para analise.\n\n`;
    message += `Pedido: ${preorderId}.\n\n`;
    message += `Cliente: [ ${cpf} ] ${customerName}.\n\n`;
    message += `Endereço: ${addressInline}.\n\n`;
    message += `Distância do Endereço até a sede: ${distance}km.\n\n`;
    message += `link de analise: https://dogao.igrejavivaemcelulas.com.br/app/analise-distancia/${preorderId}`;

    this.logger.log(`Enviando notificação para pedido de analise`);

    return this.evolutionService.sendText(phone, message);
  }

  async sendSellerReport(phone: string, report: SellerReportCache) {
    const message = `🌭 *Dogão do Pastor - Relatório de Vendas* 🌭

Olá, *${report.Seller}*! 🙌

📊 Seu resumo até agora:
• Pedidos: ${report.Orders}
• Dogs: ${report.Dogs}
• Total: R$ ${report.Total.toFixed(2)}

Continue firme! 💪`;

    this.logger.log(`Enviando relatório para vendedor: ${phone}`);
    return await this.evolutionService.sendText(phone, message);
  }

  async sendCellReport(
    phone: string,
    cellSummary: {
      Orders: number;
      Dogs: number;
      Total: number;
      sellers: SellerReportCache[];
    },
  ) {
    const sellersList = cellSummary.sellers
      .map(
        (v) =>
          `• ${v.Seller}: ${v.Orders} pedidos, ${v.Dogs} dogs (R$ ${v.Total.toFixed(2)})`,
      )
      .join('\n');

    const message = `🌭 *Dogão do Pastor - Relatório da Célula* 🌭

📊 Resumo total:
• Pedidos: ${cellSummary.Orders}
• Dogs: ${cellSummary.Dogs}
• Total: R$ ${cellSummary.Total.toFixed(2)}

👥 *Vendedores:*
${sellersList}

Deus abençoe sua liderança! 🙏`;

    this.logger.log(`Enviando relatório para célula: ${phone}}`);
    return await this.evolutionService.sendText(phone, message);
  }

  async sendPendingPaymentMessage({
    customerName,
    phone,
    orderId,
    isAbandoned = false,
  }: {
    customerName: string;
    phone?: string | null;
    orderId: string;
    isAbandoned?: boolean;
  }) {
    if (!phone) {
      this.logger.warn(
        `Cliente ${customerName} sem telefone — pedido ${orderId}`,
      );
      return;
    }

    const link = `https://dogao.igrejavivaemcelulas.com.br/comprar/${orderId}`;

    const baseMessage = isAbandoned
      ? `🌭 *Dogão do Pastor* 🌭\n\nOlá ${customerName}! 👋\n\nPercebemos que você iniciou seu pedido mas ainda não concluiu.\n\nNão perca a chance de garantir seu Dogão e participar da promoção *Noite no Natal Luz de Gramado*. Hoje é o *último dia*! 🎄\n\nFinalize seu pedido agora mesmo no link abaixo. \n\n 🙏 Deus abençoe!`
      : `🌭 *Dogão do Pastor* 🌭\n\nOlá ${customerName}! 👋\n\nSeu pedido ainda está com *pagamento pendente*.\n\nHoje é o *último dia* para garantir sua participação na promoção do *Noite no Natal Luz de Gramado*! 🎄\n\nFinalize seu pagamento aqui no link abaixo. \n\n 🙏 Deus abençoe!`;

    //const phoneFake = '51982488374';

    this.logger.log(`Enviando lembrete de pedido para: ${phone}`);
    await this.evolutionService.sendText(phone, baseMessage);
    return await this.evolutionService.sendText(phone, link);
  }

  async sendRouteAssigned(phone: string, totalStops: number) {
    const message = `🚚 Uma nova rota foi atribuída para você com ${totalStops} paradas. Inicie a rota no app.`;
    return this.evolutionService.sendText(phone, message);
  }

  async sendNextDelivery(phone, name) {
    const message = `🚚 Olá ${name}, seu pedido está a caminho! Sua casa é a próxima parada.`;
    return this.evolutionService.sendText(phone, message);
  }

  async orderDelivered(phone, orderId) {
    const message = `✅ Seu pedido #${orderId} foi entregue. Obrigado!`;
    return this.evolutionService.sendText(phone, message);
  }

  async orderDeliverySkiped(phone) {
    const message = `⚠️ O entregador não pôde entregar seu pedido agora. Vamos tentar novamente em outro momento.`;
    return this.evolutionService.sendText(phone, message);
  }

  async orderDeliveryFailed(phone, orderId) {
    const message = `❌ Não foi possível concluir a entrega do pedido #${orderId}. Em breve alguém da equipe entrará em contato.`;
    return this.evolutionService.sendText(phone, message);
  }
}
