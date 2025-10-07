import { Injectable } from '@nestjs/common';
import { EDITION_ID } from 'src/common/constants/ids';
import {
  DeliveryOptionEnum,
  OrderStatsEnum,
  PaymentStatsEnum,
} from 'src/common/enums';
import { PreOrderStepEnum } from 'src/common/enums/pre-order-step.enum';
import { DatesHelper } from 'src/common/helpers/dates-helper';
import { BaseService } from 'src/common/services/base.service';
import { CustomerRetrieve } from 'src/modules/customer/dto/customer-retrieve';
import { CustomerService } from 'src/modules/customer/services/customer.service';
import { LoggerService } from 'src/modules/logger/services/logger.service';
import { OrderOnlineFirstCreateDTO } from 'src/modules/order-online/dto/order-online-first-create.dto';
import { OrderOnlineInitRetrieveDTO } from 'src/modules/order-online/dto/order-online-init-retrieve.dto';
//import { PaymentService } from 'src/modules/payment/services/payment.service';
import { EvolutionNotificationsService } from 'src/modules/evolution/services/evolution-notifications.service';
import { OrderOnlineFullRetrieveDTO } from 'src/modules/order-online/dto/order-online-full-retrieve.dto';
import { OrderOnlineSetAddressDTO } from 'src/modules/order-online/dto/order-online-set-address.dto';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';

@Injectable()
export class OrderOnlineService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly customerService: CustomerService,
    private readonly evolutionNotificationsService: EvolutionNotificationsService,
    //private readonly paymentService: PaymentService,
  ) {
    super(loggerService, prismaService);
  }

  async start(body: OrderOnlineFirstCreateDTO): Promise<{
    presale: OrderOnlineInitRetrieveDTO;
    customer: CustomerRetrieve | null;
  }> {
    const { cpf, sellerId, sellerTag } = body;
    const customer = await this.customerService.findByCpf({ cpf: cpf });

    if (customer) {
      const haspreorder = await this.prisma.orderOnline.findFirst({
        where: {
          customerId: customer.id,
          editionId: EDITION_ID,
          status: OrderStatsEnum.digitation,
        },
      });
      if (haspreorder) {
        return {
          presale: haspreorder,
          customer: customer,
        };
      }
    }
    const isPromo: boolean = DatesHelper.IsPromoDate();
    const preSale = await this.prisma.orderOnline.create({
      data: {
        customerId: customer ? customer.id : undefined,
        editionId: EDITION_ID,
        sellerId: sellerId,
        sellerTag: sellerTag,
        quantity: 0,
        valueTotal: 0,
        customerAddressId: undefined,
        paymentStatus: PaymentStatsEnum.pending,
        paymentProvider: 'starting',
        paymentId: null,
        paymentUrl: null,
        observations: cpf,
        deliveryOption: DeliveryOptionEnum.undefined,
        step: PreOrderStepEnum.customer,
        isPromo: isPromo,
      },
    });
    const result = {
      presale: preSale,
      customer: customer,
    };
    return result;
  }

  async findById(id: string): Promise<OrderOnlineFullRetrieveDTO | null> {
    try {
      const presale = await this.prisma.orderOnline.findUnique({
        where: { id },
        include: { customer: true },
      });

      return presale;
    } catch (error) {
      console.error(error);
      throw new Error('Error API');
    }
  }

  async setAddress(
    data: OrderOnlineSetAddressDTO,
  ): Promise<OrderOnlineFullRetrieveDTO> {
    try {
      const presale = await this.prisma.orderOnline.update({
        where: { id: data.preorderId },
        data: {
          customerAddressId: data.deliveryAddressId,
          deliveryOption: DeliveryOptionEnum.delivery,
          step: PreOrderStepEnum.payment,
        },
      });
      return presale;
    } catch (error) {
      console.error(error);
      throw new Error('Error API');
    }
  }

  async setDeliveryOption(data: {
    preorderId: string;
    deliveryOption: string;
  }): Promise<OrderOnlineFullRetrieveDTO> {
    console.info('data', data);
    try {
      const option =
        data.deliveryOption === 'pickup'
          ? DeliveryOptionEnum.pickup
          : DeliveryOptionEnum.donate;
      const presale = await this.prisma.orderOnline.update({
        where: { id: data.preorderId },
        data: {
          customerAddressId: null,
          deliveryOption: option,
          step: PreOrderStepEnum.payment,
        },
      });
      return presale;
    } catch (error) {
      console.error(error);
      throw new Error('Error API');
    }
  }

  selectNewStep(step: string) {
    switch (step) {
      case 'pix':
        return PreOrderStepEnum.pix;
      case 'card':
        return PreOrderStepEnum.card;
      case 'cartao':
        return PreOrderStepEnum.card;
      case 'customer':
        return PreOrderStepEnum.customer;
      case 'delivery':
        return PreOrderStepEnum.delivery;
      case 'order':
        return PreOrderStepEnum.order;
      case 'payment':
        return PreOrderStepEnum.payment;
      default:
        return PreOrderStepEnum.tanks;
    }
  }

  async changeStep(data: {
    preorderId: string;
    step: string;
  }): Promise<OrderOnlineFullRetrieveDTO> {
    try {
      const newStep = this.selectNewStep(data.step);
      const presale = await this.prisma.orderOnline.update({
        where: { id: data.preorderId },
        data: {
          step: newStep, //,
        },
      });
      return presale;
    } catch (error) {
      console.error(error);
      throw new Error('Error API');
    }
  }
}
