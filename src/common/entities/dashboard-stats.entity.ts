// src/common/entities/dashboard-stats.entity.ts
export interface DashboardStatsEntity {
  editionName: string;
  totalDogsSold: number;
  availableDogs: number;
  totalRevenue: number;
  totalDonations: number;
  pendingAnalysis: number;
  
  // Estatísticas de Produto
  ingredientsStats: { name: string; count: number }[];
  paymentMethodsStats: { method: string; count: number }[];
  
  // Rankings
  rankingCells: { name: string; total: number }[];
  
  // Listas
  recentOrders: any[];
  abandonedOrdersCount: number;
}