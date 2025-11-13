// src/reports/interfaces/SellerReportCache.interface.ts
export interface SellerReportCache {
  sellerId: string; // novo campo para mapear com DB
  Seller: string;
  Cell: string;
  cellId?: string | null;
  Network: string;
  Orders: number;
  Dogs: number;
  Total: number;
}
