export interface ICellNetwork {
  id: string;
  name: string;
  supervisorName: string;
  phone: string;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}
