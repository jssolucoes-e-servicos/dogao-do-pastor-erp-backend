//ENDEREÇO/NOME DO ARQUIVO: src/modules/pre-sale/services/pre-sale.service.ts
import { PRICE_PER_DOG } from '@/common/constants';
import { PreOrderStepEnum } from '@/common/enums';
import { BaseService } from '@/common/services/base.service';
import { LoggerService } from '@/modules/logger/services/logger.service';
import { Injectable } from '@nestjs/common';
import { PreSaleInitRetrieveDTO } from 'src/modules/pre-sale/dto/pre-sale-init-retrieve.dto';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { PreSaleItemsManyCreateDTO } from '../dto/pre-sale-items-many-create.dto';

@Injectable()
export class PreSaleItemsService extends BaseService {
  constructor(loggerService: LoggerService, prismaService: PrismaService) {
    super(loggerService, prismaService);
  }

  async inserts(
    body: PreSaleItemsManyCreateDTO,
  ): Promise<PreSaleInitRetrieveDTO> {
    const { preOrderId, orderItems } = body;

    await this.prisma.preOrderItem.deleteMany({
      where: { preOrderId: preOrderId },
    });

    const itemsToCreate = orderItems.map((item) => ({
      preOrderId: preOrderId,
      removedIngredients: item.removedIngredients,
    }));

    await this.prisma.preOrderItem.createMany({
      data: itemsToCreate,
    });

    const presale = await this.prisma.preOrder.update({
      where: {
        id: preOrderId,
      },
      data: {
        quantity: orderItems.length,
        valueTotal: orderItems.length * PRICE_PER_DOG,
        step: PreOrderStepEnum.payment,
      },
    });

    return presale;
  }

  /* async processOrder(body: PreSaleCreateDTO) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

      // Aqui, o PreSaleService agora usa o PaymentService para criar o pagamento
      // É importante notar que ele pode usar createPixPayment ou createCardPayment dependendo da lógica que você quiser implementar aqui
      // Como não temos a lógica de escolha, manteremos apenas o `preOrder` e os dados para que o cliente possa chamar o endpoint de pagamento por conta própria.
      return {
        preOrderId: preOrder.id,
        totalAmount: totalAmount,
        customerEmail: customer.email,
      };
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
      throw new HttpException(
        'Erro interno do servidor.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  } */
}
