export interface DashboardStatsEntity {
  editionName: string;
  totalDogsSold: number;
  availableDogs: number;
  totalRevenue: number;
  totalDonations: number;
  pendingAnalysis: number;
  abandonedOrdersCount: number;
  // Rankings e Estatísticas
  ingredientsStats: { name: string; count: number }[];
  paymentMethodsStats: { method: string; count: number }[];
  rankingCells: { name: string; total: number }[];
  rankingSellers: { name: string; total: number }[];
  // Logística e Doações
  logisticsStats: { label: string; value: number }[];
  donationsByPartner: { label: string; value: number }[];
  // Listas
  recentOrders: {
    id: string;
    customer: string;
    status: string;
    time: Date;
  }[];
}
