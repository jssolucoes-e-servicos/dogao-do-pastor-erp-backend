import { ICellNetwork } from './cell-network.interface';
import { ISeller } from './seller.interface';

export interface ICell {
  id: string;
  name: string;
  leaderName: string;
  networkId: string;
  network: ICellNetwork;
  networkName: string;
  sellers?: ISeller[] | null | undefined;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}
