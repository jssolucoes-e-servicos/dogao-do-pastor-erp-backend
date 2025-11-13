export interface ICountSoldsWithRank {
  totalCount: number;
  totalValue: number;
  rank_cells: { name: string; quantity: number }[];
  rank_sellers: { name: string; quantity: number }[];
}
