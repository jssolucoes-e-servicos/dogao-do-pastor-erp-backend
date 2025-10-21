import { ICell } from './cell.interface';
import { IOrderOnline } from './order-online.interfaces';

export interface ISeller {
  id: string;
  cellId: string;
  cell?: ICell | null | undefined;
  name: string;
  phone: string;
  tag: string;
  ordersOnline?: IOrderOnline[] | null | undefined;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
