import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePreferenceDto } from 'src/common/interfaces/mp-types.interface';
import { MercadoPagoService } from 'src/modules/mercadopago/services/mercadopago.service';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { PreSaleCreateDTO } from '../dto/pre-sale-create.dto';

@Injectable()
export class PreSaleService {
  constructor(
    private prisma: PrismaService,
    private mercadoPagoService: MercadoPagoService,
  ) {
    /* void */
  }

  async processOrder(body: PreSaleCreateDTO) {
    //console.log(body);
    const { customerId, orderItems, deliveryAddressId, deliveryOption } = body;
    const editionActivedId: string = process.env.EDITION_ID!;

    if (!customerId || !orderItems || !deliveryOption) {
      throw new HttpException(
        'Dados do pedido incompletos.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const requiredDeliveryAddressId =
      deliveryOption === 'delivery' ? true : false;
    if (requiredDeliveryAddressId === true && deliveryAddressId === null) {
      throw new HttpException(
        'Dados do pedido incompletos.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id: customerId },
      });
      if (!customer) {
        throw new HttpException('Cliente inválido.', HttpStatus.BAD_REQUEST);
      }

      const totalAmount = orderItems.length * 19.99;

      const dataSend = {
        customerId: customerId,
        deliveryOption: deliveryOption,
        addressId: deliveryOption === 'delivery' ? deliveryAddressId : null,
        editionId: editionActivedId,
        quantity: orderItems.length,
        valueTotal: totalAmount,
        paymentStatus: 'pending',
        paymentProvider: 'mercadopago',
        isPromo: true,
      };

      const preOrder = await this.prisma.$transaction(async (tx) => {
        const newPreOrder = await tx.preOrder.create({
          data: dataSend,
        });

        const itemsToCreate = orderItems.map((item) => ({
          preOrderId: newPreOrder.id,
          removedIngredients: item.removedIngredients,
        }));

        await tx.preOrderItem.createMany({
          data: itemsToCreate,
        });

        return newPreOrder;
      });

      const preferenceBody: CreatePreferenceDto = {
        items: orderItems.map((item, index) => ({
          id: (index + 1).toString(),
          title: 'Dogão Personalizado',
          unit_price: 19.99,
          quantity: 1,
        })),
        external_reference: preOrder.id,
        payer: {
          name: customer.name,
          // Corrigindo o erro de tipagem: garantimos que o email é sempre uma string.
          email: customer.email || '',
        },
        back_urls: {
          success: 'http://localhost:3000/success',
          failure: 'http://localhost:3000/failure',
          pending: 'http://localhost:3000/pending',
        },
        notification_url:
          'https://dogao-do-pastor-erp-backend-production.up.railway.app/webhooks/mercadopago',
      };

      const paymentUrl =
        await this.mercadoPagoService.createPreference(preferenceBody);
      console.log(paymentUrl);
      return { paymentUrl };
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      throw new HttpException(
        'Erro interno do servidor.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
