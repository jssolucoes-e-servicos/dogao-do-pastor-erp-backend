// src/common/helpers/edition.helper.ts

import { PrismaService } from 'src/common/helpers/importer.helper';
import { EditionEntity } from '../entities';

export async function getActiveEdition(
  prisma: PrismaService,
): Promise<EditionEntity | null> {
  const now = new Date();

  return (await prisma.edition.findFirst({
    where: {
      active: true,
      saleStartDate: {
        lte: now,
      },
      autoDisableDate: {
        gte: now,
      },
    },
    orderBy: {
      saleStartDate: 'desc',
    },
  })) as unknown as EditionEntity;
}
