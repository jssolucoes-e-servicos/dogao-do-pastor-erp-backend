// src/common/interfaces/user.interface.ts

export interface IUser {
  id: string;
  name?: string;
  type: string;
  roles: string[];
  sellerId?: string | null;
  deliveryPersonId?: string | null;
  leaderCellId?: string | null;
  supervisorNetworkId?: string | null;
}
