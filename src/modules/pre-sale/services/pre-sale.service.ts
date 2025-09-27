//ENDEREÇO/NOME DO ARQUIVO: src/modules/pre-sale/services/pre-sale.service.ts
import { DeliveryOptionEnum, PaymentStatusEnum } from '@/common/enums';
import { CustomerRetrieve } from '@/modules/customer/dto/customer-retrieve';
import { CustomerService } from '@/modules/customer/services/customer.service';
import { Injectable } from '@nestjs/common';
import { EDITION_ID } from 'src/common/constants/ids';
import { PaymentService } from 'src/modules/payment/services/payment.service';
import { PreSaleFirstCreateDTO } from 'src/modules/pre-sale/dto/pre-sale-first-create.dto';
import { PreSaleInitRetrieveDTO } from 'src/modules/pre-sale/dto/pre-sale-init-retrieve.dto';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { PreSaleFullRetrieveDTO } from '../dto/pre-sale-full-retrieve.dto';

@Injectable()
export class PreSaleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customerService: CustomerService,
    private readonly paymentService: PaymentService,
  ) {
    /* void */
  }

  async start(body: PreSaleFirstCreateDTO): Promise<{
    presale: PreSaleInitRetrieveDTO;
    customer: CustomerRetrieve | null;
  }> {
    const { cpf, sellerId } = body;
    const customer = await this.customerService.findByCpf({ cpf: cpf });
    const preSale = await this.prisma.preOrder.create({
      data: {
        customerId: customer ? customer.id : undefined,
        editionId: EDITION_ID,
        sellerId: sellerId,
        quantity: 0,
        valueTotal: 0,
        customerAddressId: undefined,
        paymentStatus: PaymentStatusEnum.PENDING,
        paymentProvider: 'starting',
        paymentId: null,
        paymentUrl: null,
        observations: cpf,
        deliveryOption: DeliveryOptionEnum.PICKUP,
        isPromo: true,
      },
    });
    const result = {
      presale: preSale,
      customer: customer,
    };
    return result;
  }

  async findById(id: string): Promise<PreSaleFullRetrieveDTO | null> {
    try {
      const presale = await this.prisma.preOrder.findUnique({
        where: { id },
        include: { customer: true },
      });

      return presale;
    } catch (error) {
      console.error(error);
      throw new Error('Error API');
    }
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
