import { OrderEntity, VoucherEntity } from ".";

export class OrderItemEntity {
  id: string;
  order: OrderEntity;
  orderId: string;
  unitPrice: number;
  removedIngredients: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  vouchers: VoucherEntity[];
}
