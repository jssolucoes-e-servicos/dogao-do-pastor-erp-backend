export class CellsRetrieveDto {
  id: string;
  name: string;
  network?: unknown;
  networkId: string;
  leaderName: string;
  active: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
  sellers?: unknown[];
}
