import { PrismaClient } from '@prisma/client';

export async function seedEditions(prisma: PrismaClient) {
  const editions = [
    {
      id: 'clz8x9r1n000g3b6p6g8h0i2j',
      name: 'Novembro 2025',
      productionDate: new Date('2025-11-15'),
      code: '253',
      saleStartDate: new Date('2025-10-11T08:00:00-03:00'),
      saleEndDate: new Date('2025-11-15T21:30:00-03:00'),
      autoEnableDate: new Date('2025-10-11T08:00:00-03:00'),
      autoDisableDate: new Date('2025-11-15T21:30:00-03:00'),
      limitSale: 1000,
      dogsSold: 1000,
      dogPrice: 19.99,
      active: false,
    },
    {
      id: 'clz8x9r1n000h3b6p0k2l4m6n',
      name: 'Março 2026',
      productionDate: new Date('2026-03-15'),
      code: '261',
      saleStartDate: new Date('2026-01-10T08:00:00-03:00'),
      saleEndDate: new Date('2026-03-15T21:30:00-03:00'),
      autoEnableDate: new Date('2026-01-10T08:00:00-03:00'),
      autoDisableDate: new Date('2026-03-15T21:30:00-03:00'),
      limitSale: 1500,
      dogsSold: 0,
      dogPrice: 24.99,
      active: true,
    },
  ];

  for (const edition of editions) {
    const exists = await prisma.edition.findFirst({
      where: { code: edition.code },
    });

    if (exists) continue;

    await prisma.edition.create({
      data: edition,
    });
  }
}
