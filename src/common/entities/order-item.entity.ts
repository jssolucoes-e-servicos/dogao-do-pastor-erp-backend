import { OrderEntity, VoucherEntity } from ".";

export class OrderItemEntity {
  id: string;
  order?: OrderEntity;
  orderId: string;
  unitPrice: number;
  isPromo: boolean;
  removedIngredients: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date  | null;
  vouchers?: VoucherEntity[];
}
