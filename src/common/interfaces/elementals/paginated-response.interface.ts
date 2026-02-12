export interface IPaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  meta: IPaginationMeta;
}
