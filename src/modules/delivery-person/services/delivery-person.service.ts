import {
  ConfigService,
  LoggerService,
  PrismaService,
} from '@/common/helpers/importer-helper';
import { BaseService } from '@/common/services/base.service';
import { DeliveryGateway } from '@/modules/delivery/gateways/delivery.gateway';
import { Injectable } from '@nestjs/common';
import { InputJsonValue } from '@prisma/client/runtime/library';
//import * as webpush from 'web-push';

/* webpush.setVapidDetails(
  'mailto:seu-email@exemplo.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
); */

@Injectable()
export class DeliveryPersonService extends BaseService {
  constructor(
    loggerService: LoggerService,
    prismaService: PrismaService,
    configService: ConfigService,
    private readonly gateway: DeliveryGateway,
  ) {
    super(loggerService, prismaService, configService);
  }

  async savePushSubscription(
    deliveryPersonId: string,
    subscription: InputJsonValue,
  ) {
    await this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: { pushSubscription: subscription }, // Adicione pushSubscription no model do Prisma
    });
  }

  async getStatus(deliveryPersonId: string) {
    const dp = await this.prisma.deliveryPerson.findUnique({
      where: { id: deliveryPersonId },
      select: { online: true, inRoute: true },
    });
    return dp || { online: false, inRoute: false };
  }

  async setStatus(
    deliveryPersonId: string,
    online: boolean,
    inRoute?: boolean,
  ) {
    this.logger.log('receidev call: ' + deliveryPersonId + ' - ' + online);
    const data: any = { online };
    if (typeof inRoute === 'boolean') data.inRoute = inRoute;
    await this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: {
        online: online,
      },
    });
    // Notifica via socket (opcional)
    this.gateway.server.emit('delivery-person:status', {
      deliveryPersonId,
      ...data,
    });
    return { ok: true, status: data };
  }

  async updateLocation(deliveryPersonId: string, lat: number, lng: number) {
    // Salva local no campo deliveryPerson se desejar (adapte seu model)
    await this.prisma.deliveryPerson.update({
      where: { id: deliveryPersonId },
      data: {
        /* lat, lng */
      },
    });
    this.gateway.broadcastLocationUpdate(deliveryPersonId, lat, lng);
    return { ok: true };
  }
}
