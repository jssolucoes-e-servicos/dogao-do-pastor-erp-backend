// src/common/entities/delivery-stop.entity.ts

import { DeliveryRouteEntity, OrderEntity } from ".";
import { DeliveryStopStatusEnum } from "../enums";

export class DeliveryStopEntity {
  id: string;
  route: DeliveryRouteEntity;
  routeId: string;
  order: OrderEntity;
  orderId: string;
  sequence: number;
  status: DeliveryStopStatusEnum;
  deliveredAt?: Date;
  skippedAt?: Date;
  failedAt?: Date;
  lat?: number;
  lng?: number;
  createdAt: Date;
  updatedAt: Date;
}
