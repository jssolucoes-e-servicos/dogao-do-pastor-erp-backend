import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
    const { customerData, orderItems, deliveryAddress, cpf } = body;
    const editionActivedId: string = process.env.EDITION_ID!;

    if (!customerData || !orderItems || !deliveryAddress || !cpf) {
      throw new HttpException(
        'Dados do pedido incompletos.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      let customer = await this.prisma.customer.findUnique({
        where: { cpf },
      });

      if (!customer) {
        customer = await this.prisma.customer.create({
          data: {
            cpf,
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
          },
        });
      } else {
        await this.prisma.customer.update({
          where: { cpf },
          data: {
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
          },
        });
      }

      const existingAddress = await this.prisma.customerAddress.findFirst({
        where: {
          customerId: customer.id,
          street: deliveryAddress.street,
          number: deliveryAddress.number,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zipCode: deliveryAddress.zipCode,
        },
      });

      let address = existingAddress;
      if (!address) {
        address = await this.prisma.customerAddress.create({
          data: { ...deliveryAddress, customerId: customer.id },
        });
      }

      const totalAmount = orderItems.length * 19.99;

      const preOrder = await this.prisma.$transaction(async (tx) => {
        const newPreOrder = await tx.preOrder.create({
          data: {
            customerId: customer.id,
            editionId: editionActivedId,
            quantity: orderItems.length,
            valueTotal: totalAmount,
            paymentStatus: 'pending',
            paymentProvider: 'mercadopago',
            addressId: address.id,
            isPromo: true,
          },
        });

        const itemsToCreate = orderItems.map((item) => ({
          preOrderId: newPreOrder.id,
          removedIngredients: item.removedIngredients,
        }));

        const items = await tx.preOrderItem.createMany({
          data: itemsToCreate,
        });
        console.log(items);
        return newPreOrder;
      });

      const preferenceBody = {
        items: orderItems.map((item) => ({
          id: '657', //item.id,
          title: 'Dogão Personalizado',
          unit_price: 19.99,
          quantity: 1,
        })),
        external_reference: preOrder.id,
        payer: {
          name: customerData.name,
          email: customerData.email,
        },
        back_urls: {
          success: 'http://localhost:3000/success',
          failure: 'http://localhost:3000/failure',
          pending: 'http://localhost:3000/pending',
        },
        auto_return: 'approved',
        notification_url: 'https://seu-backend-deploy.com/webhooks/mercadopago', // Você vai mudar esta URL depois do deploy
      };

      const paymentUrl =
        await this.mercadoPagoService.createPreference(preferenceBody);
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
