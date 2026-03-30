// src/common/helpers/edition.helper.ts

import { PrismaService } from 'src/common/helpers/importer.helper';
import { EditionEntity } from '../entities';

export async function getActiveEdition(
  prisma: PrismaService,
): Promise<EditionEntity | null> {
  const now = new Date();

  // 1. Tenta encontrar a edição estritamente ativa no momento
  // autoDisableDate é opcional — se não preenchido, não bloqueia
  const active = await prisma.edition.findFirst({
    where: {
      active: true,
      saleStartDate: { lte: now },
      OR: [
        { autoDisableDate: null },
        { autoDisableDate: { gte: now } },
      ],
    },
    orderBy: { saleStartDate: 'desc' },
  });

  if (active) {
    // Regra de segurança: Se faltarem menos de 30 dogs para o limite, considera encerrado
    const margin = 30;
    if (active.dogsSold >= (active.limitSale - margin)) {
      return null;
    }
    return active as unknown as EditionEntity;
  }

  // 2. Fallback: última edição marcada como ativa, independente de datas
  const fallback = (await prisma.edition.findFirst({
    where: { active: true },
    orderBy: { saleStartDate: 'desc' },
  })) as unknown as EditionEntity;

  if (fallback) {
    const margin = 30;
    if (fallback.dogsSold >= (fallback.limitSale - margin)) {
      return null;
    }
    return fallback;
  }

  return null;
}
