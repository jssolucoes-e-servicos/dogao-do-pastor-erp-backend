import { WithdrawalEntity } from "./withdrawal.entity";

export class WithdrawalItemEntity {
  id: string;
  withdrawal?: WithdrawalEntity;
  withdrawalId: string;
  quantity: number;
  removedIngredients: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
