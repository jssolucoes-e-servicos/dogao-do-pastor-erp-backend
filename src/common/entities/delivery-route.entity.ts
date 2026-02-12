// src/common/entities/delivery-route.entity.ts

import { DeliveryRouteStatusEnum } from "../enums";
import { DeliveryPersonEntity, DeliveryStopEntity } from "./";

export class DeliveryRouteEntity {
  id: string;
  deliveryPerson: DeliveryPersonEntity;
  deliveryPersonId: string;
  startedAt?: Date;
  finishedAt?: Date;
  status: DeliveryRouteStatusEnum;
  totalStops: number;
  completedStops: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;

  stops: DeliveryStopEntity[];
}
