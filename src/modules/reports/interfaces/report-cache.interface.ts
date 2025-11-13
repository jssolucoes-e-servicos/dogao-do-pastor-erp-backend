// src/reports/interfaces/report-cache.interface.ts
import { SellerReportCache } from './SellerReportCache.interface';

export interface IReportCache {
  id: string;
  type: string;
  refId: string;
  summary: SellerReportCache;
  sentAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}
