import {
  BaseService,
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { EvolutionNotificationsService } from '@/modules/evolution/services/evolution-notifications.service';
import { Injectable } from '@nestjs/common';
import { EDITION_ID } from 'src/common/constants/ids';
import {
  DeliveryOptionEnum,
  OrderStatsEnum,
  PaymentStatsEnum,
} from 'src/common/enums';
import { PreOrderStepEnum } from 'src/common/enums/pre-order-step.enum';
import { DatesHelper } from 'src/common/helpers/dates-helper';
import { CustomerRetrieve } from 'src/modules/customer/dto/customer-retrieve';
import { CustomerService } from 'src/modules/customer/services/customer.service';
import { OrderOnlineFirstCreateDTO } from 'src/modules/order-online/dto/order-online-first-create.dto';
import { OrderOnlineFullRetrieveDTO } from 'src/modules/order-online/dto/order-online-full-retrieve.dto';
import { OrderOnlineInitRetrieveDTO } from 'src/modules/order-online/dto/order-online-init-retrieve.dto';
import { OrderOnlineSetAddressDTO } from 'src/modules/order-online/dto/order-online-set-address.dto';

@Injectable()
export class OrderOnlineService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly customerService: CustomerService,
    private readonly evolutionNotificationsService: EvolutionNotificationsService,
  ) {
    super(loggerService, prismaService, configService);
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

      const dataToChange = {
        step: newStep,
      };
      const presale = await this.prisma.orderOnline.update({
        where: { id: data.preorderId },
        data: dataToChange,
      });
      return presale;
    } catch (error) {
      console.error(error);
      throw new Error('Error API');
    }
  }

  async setAnalysis(data: {
    preorderId: string;
    deliveryAddressId: string;
    deliveryTime: string;
    distance: string;
    addressInline: string;
  }): Promise<OrderOnlineFullRetrieveDTO> {
    try {
      const exists = await this.prisma.orderOnline.findFirst({
        where: { id: data.preorderId },
        include: { customer: true },
      });
      if (!exists || !exists.customer) {
        throw new Error('Não encontrado o pedido');
      }
      const presale = await this.prisma.orderOnline.update({
        where: { id: data.preorderId },
        data: {
          step: PreOrderStepEnum.analysis,
          deliveryOption: DeliveryOptionEnum.delivery,
          customerAddressId: data.deliveryAddressId,
          observations: `${exists?.observations} | Analise de pedido com excesso e distância: ${data.distance}km da sede`,
        },
      });
      this.logger.warn(
        `Pedido ${data.preorderId}, do CPF: ${exists?.customer?.cpf}, foi enviado para análise.`,
      );
      this.evolutionNotificationsService.sendEntryAnalysis(
        '51982488374',
        data.preorderId,
        exists?.customer?.name,
        exists?.customer?.cpf,
        data.distance,
        data.addressInline,
      );
      return presale;
    } catch (error) {
      console.error(error);
      throw new Error('Error API');
    }
  }
}
