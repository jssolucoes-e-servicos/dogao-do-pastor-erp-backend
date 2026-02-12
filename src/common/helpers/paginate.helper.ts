// src/common/helpers/paginate.helper.ts

import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PrismaClient } from '../../generated/client';

export async function paginate<
  ModelDelegate extends {
    findMany: Function;
    count: Function;
  },
>(
  prisma: PrismaClient,
  model: ModelDelegate,
  query: PaginationQueryDto,
  args: any,
) {
  const { page, perPage } = query;
  const { take, skip } = getPaginationParams(page, perPage);

  const [data, total] = await prisma.$transaction([
    model.findMany({
      ...args,
      take,
      skip,
    }),
    model.count(),
  ]);

  return {
    data,
    meta: getPaginationMeta(page, perPage, total),
  };
}

export function getPaginationParams(page = 1, perPage = 10) {
  const take = perPage;
  const skip = (page - 1) * perPage;

  return { take, skip };
}

export function getPaginationMeta(
  page: number,
  perPage: number,
  total: number,
) {
  return {
    page,
    perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  };
}
