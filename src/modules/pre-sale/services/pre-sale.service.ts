//ENDEREÇO/NOME DO ARQUIVO: src/modules/pre-sale/services/pre-sale.service.ts
import {
  DeliveryOptionEnum,
  OrderStatsEnum,
  PaymentStatsEnum,
} from '@/common/enums';
import { PreOrderStepEnum } from '@/common/enums/pre-order-step.enum';
import { DatesHelper } from '@/common/helpers/dates-helper';
import { BaseService } from '@/common/services/base.service';
import { CustomerRetrieve } from '@/modules/customer/dto/customer-retrieve';
import { CustomerService } from '@/modules/customer/services/customer.service';
import { LoggerService } from '@/modules/logger/services/logger.service';
import { Injectable } from '@nestjs/common';
import { EDITION_ID } from 'src/common/constants/ids';
import { PaymentService } from 'src/modules/payment/services/payment.service';
import { PreSaleFirstCreateDTO } from 'src/modules/pre-sale/dto/pre-sale-first-create.dto';
import { PreSaleInitRetrieveDTO } from 'src/modules/pre-sale/dto/pre-sale-init-retrieve.dto';
import { PrismaService } from 'src/modules/prisma/services/prisma.service';
import { PreSaleFullRetrieveDTO } from '../dto/pre-sale-full-retrieve.dto';
import { PreSaleSetAddressDTO } from '../dto/pre-sale-set-address.dto';

@Injectable()
export class PreSaleService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    private readonly customerService: CustomerService,
    private readonly paymentService: PaymentService,
  ) {
    super(loggerService, prismaService);
  }

  async start(body: PreSaleFirstCreateDTO): Promise<{
    presale: PreSaleInitRetrieveDTO;
    customer: CustomerRetrieve | null;
  }> {
    const { cpf, sellerId, sellerTag } = body;
    const customer = await this.customerService.findByCpf({ cpf: cpf });

    if (customer) {
      const haspreorder = await this.prisma.preOrder.findFirst({
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
    const preSale = await this.prisma.preOrder.create({
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

  async setAddress(
    data: PreSaleSetAddressDTO,
  ): Promise<PreSaleFullRetrieveDTO> {
    try {
      const presale = await this.prisma.preOrder.update({
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
  }): Promise<PreSaleFullRetrieveDTO> {
    console.info('data', data);
    try {
      const option =
        data.deliveryOption === 'pickup'
          ? DeliveryOptionEnum.pickup
          : DeliveryOptionEnum.donate;
      const presale = await this.prisma.preOrder.update({
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
  }): Promise<PreSaleFullRetrieveDTO> {
    try {
      const newStep = this.selectNewStep(data.step);
      const presale = await this.prisma.preOrder.update({
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
