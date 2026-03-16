// src/common/helpers/edition.helper.ts

import { PrismaService } from 'src/common/helpers/importer.helper';
import { EditionEntity } from '../entities';

export async function getActiveEdition(
  prisma: PrismaService,
): Promise<EditionEntity | null> {
  const now = new Date();

  // 1. Tenta encontrar a edição estritamente ativa no momento
  const active = await prisma.edition.findFirst({
    where: {
      active: true,
      saleStartDate: { lte: now },
      autoDisableDate: { gte: now },
    },
    orderBy: { saleStartDate: 'desc' },
  });

  if (active) return active as unknown as EditionEntity;

  // 2. Fallback: Se não houver estritamente ativa, pega a última que foi marcada como ativa
  return (await prisma.edition.findFirst({
    where: { active: true },
    orderBy: { saleStartDate: 'desc' },
  })) as unknown as EditionEntity;
}
