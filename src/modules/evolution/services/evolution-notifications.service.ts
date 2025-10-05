// src/modules/evolution/services/evolution-notifications.service.ts (Novo Serviço)

import { BaseService } from '@/common/services/base.service';
import { LoggerService } from '@/modules/logger/services/logger.service';
import { PrismaService } from '@/modules/prisma/services/prisma.service';
import { Injectable } from '@nestjs/common';
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
    // Injeta o serviço responsável pela comunicação HTTP
    private readonly evolutionService: EvolutionService,
  ) {
    super(loggerService, prismaService);
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
}
