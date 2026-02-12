// src/common/helpers/soft-delete.helper.ts

/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { PrismaClient } from '../../generated/client';

export async function softDelete<
  ModelDelegate extends {
    update: Function;
  },
>(prisma: PrismaClient, model: ModelDelegate, where: any) {
  return await model.update({
    where,
    data: {
      deletedAt: new Date(),
    },
  });
}

export async function restore<
  ModelDelegate extends {
    update: Function;
  },
>(prisma: PrismaClient, model: ModelDelegate, where: any) {
  return await model.update({
    where,
    data: {
      deletedAt: null,
    },
  });
}
