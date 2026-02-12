import { PrismaClient } from '@prisma/client';

export async function seedSellers(prisma: PrismaClient) {
  const sellers = [
    {
      id: 'clz8x9r1n001p3b6p6e7f8g9h',
      name: 'Dogão do Pastor - Web Site',
      cellId: 'clz8x9r1n001a3b6p9y8x7v6u',
      contributorId: 'clz8x9r1n00003b6p7z2k9j1a',
      tag: 'dogao',
      active: false,
    },
    {
      id: 'clz8x9r1n001q3b6p0i1j2k3l',
      name: 'Célula Ebenézer 1 - Anderson',
      cellId: 'clz8x9r1n001b3b6p0a1b2c3d',
      contributorId: 'clz8x9r1n00053b6p8o9p0q1r',
      tag: 'ebenezer1',
      active: false,
    },
    {
      id: 'clz8x9r1n001r3b6p4m5n6o7p',
      name: 'Célula Ebenézer 2 - Mônica',
      cellId: 'clz8x9r1n001c3b6p4e5f6g7h',
      contributorId: 'clz8x9r1n00063b6p2s3t4u5v',
      tag: 'ebenezer2',
      active: false,
    },
    {
      id: 'clz8x9r1n001s3b6p8q9r0s1t',
      name: 'Célula Ebenézer 3 - Elusa',
      cellId: 'clz8x9r1n001d3b6p8i9j0k1l',
      contributorId: 'clz8x9r1n00073b6p6w7x8y9z',
      tag: 'ebenezer3',
      active: false,
    },
    {
      id: 'clz8x9r1n001t3b6p2u3v4w5x',
      name: 'Alexsander Pereira',
      cellId: 'clz8x9r1n001d3b6p8i9j0k1l',
      contributorId: 'py41k2e4a33446o9c0m5x2w4n',
      tag: 'alexpereira',
      active: false,
    },
    {
      id: 'clz8x9r1n001u3b6p6y7z8a9b',
      name: 'Célula Ebenézer 4 - Carla',
      cellId: 'clz8x9r1n001e3b6p2m3n4o5p',
      contributorId: 'clz8x9r1n00083b6p0a2b4c6d',
      tag: 'ebenezer4',
      active: false,
    },
    {
      id: 'clz8x9r1n001v3b6p0c1d2e3f',
      name: 'Célula Ebenézer 5 - Mara Santos',
      cellId: 'clz8x9r1n001f3b6p6q7r8s9t',
      contributorId: 'clz8x9r1n00093b6p8e0f2g4h',
      tag: 'ebenezer5',
      active: false,
    },
    {
      id: 'clz8x9r1n001w3b6p4g5h6i7j',
      name: 'Rede Jovens - Kelvin',
      cellId: 'clz8x9r1n001j3b6p2g3h4i5j',
      contributorId: 'clz8x9r1n000a3b6p2i4j6k8l',
      tag: 'jovens',
      active: false,
    },
    {
      id: 'clz8x9r1n001x3b6p8k9l0m1n',
      name: 'Célula Aba - Enio',
      cellId: 'clz8x9r1n001k3b6p6k7l8m9n',
      contributorId: 'clz8x9r1n000c3b6p0q2r4s6t',
      tag: 'aba',
      active: false,
    },
    {
      id: 'dly9y0s2o11224c7q8a3l0k2b',
      name: 'Célula Emaús - Jackson',
      cellId: 'clz8x9r1n001l3b6p0o1p2q3r',
      contributorId: 'clz8x9r1n000b3b6p6m8n0o2p',
      tag: 'emaus',
      active: false,
    },
    {
      id: 'eny0z1t3p22335d8r9b4m1l3c',
      name: 'Célula Ágape - Maria',
      cellId: 'clz8x9r1n001m3b6p4s5t6u7v',
      contributorId: 'clz8x9r1n000d3b6p4u6v8w0x',
      tag: 'agape',
      active: false,
    },
    {
      id: 'foz1a2u4q33446e9s0c5n2m4d',
      name: 'Célula Viva 1 - Pr. Fabiano',
      cellId: 'clz8x9r1n001n3b6p8w9x0y1z',
      contributorId: 'clz8x9r1n000e3b6p8y0z2a4b',
      tag: 'viva1',
      active: false,
    },
    {
      id: 'gpz2b3v5r44557f0t1d6o3n5e',
      name: 'Célula Viva 2 - Pr. João',
      cellId: 'clz8x9r1n001o3b6p2a3b4c5d',
      contributorId: 'clz8x9r1n000f3b6p2c4d6e8f',
      tag: 'viva2',
      active: false,
    },
    {
      id: 'hqz3c4w6s55668g1u2e7p4o6f',
      name: 'Pastor Fabiano Santos',
      cellId: 'clz8x9r1n001a3b6p9y8x7v6u',
      contributorId: 'clz8x9r1n000e3b6p8y0z2a4b',
      tag: 'prfabiano',
      active: false,
    },
    {
      id: 'irz4d5x7t66779h2v3f8q5p7g',
      name: 'Célula Jardim Regado 1 - Alice',
      cellId: 'clz8x9r1n001g3b6p0u1v2w3x',
      contributorId: 'clz8x9r1n00023b6p9w8v7u6t',
      tag: 'jdr1',
      active: false,
    },
    {
      id: 'jsz5e6y8u77880i3w4g9r6q8h',
      name: 'Célula Jardim Regado 3 - Adriana',
      cellId: 'clz8x9r1n001h3b6p4y5z6a7b',
      contributorId: 'clz8x9r1n00033b6p0m1n2o3p',
      tag: 'jdr3',
      active: false,
    },
    {
      id: 'ktz6f7z9v88991j4x5h0s7r9i',
      name: 'Alex Trindade',
      cellId: 'clz8x9r1n001h3b6p4y5z6a7b',
      contributorId: 'qz52l3f5b44557p0d1n6y3x5o',
      tag: 'qz52l3f5b44557p0d1n6y3x5o',
      active: false,
    },
    {
      id: 'lu07g8a0w99002k5y6i1t8s0j',
      name: 'Célula Jardim Regado 2 - Patrícia',
      cellId: 'clz8x9r1n001i3b6p8c9d0e1f',
      contributorId: 'clz8x9r1n00043b6p4k5l6m7n',
      tag: 'jdr2',
      active: false,
    },
    {
      id: 'mv18h9b1x00113l6z7j2u9t1k',
      name: 'Teófilo Santos',
      cellId: 'clz8x9r1n001i3b6p8c9d0e1f',
      contributorId: 'ra63m4g6c55668q1e2o7z4y6p',
      tag: 'teofilo',
      active: false,
    },
    {
      id: 'nw29i0c2y11224m7a8k3v0u2l',
      name: 'Solange',
      cellId: 'clz8x9r1n001n3b6p8w9x0y1z',
      contributorId: 'sb74n5h7d66779r2f3p8a5z7q',
      tag: 'solange',
      active: false,
    },
    {
      id: 'ox30j1d3z22335n8b9l4w1v3m',
      name: "Fabiane Sant'ana",
      cellId: 'clz8x9r1n001b3b6p0a1b2c3d',
      contributorId: 'tc85o6i8e77880s3g4q9b6a8r',
      tag: 'fabiane',
      active: false,
    },
  ];

  for (const seller of sellers) {
    const exists = await prisma.seller.findFirst({
      where: { tag: seller.tag },
    });

    if (exists) continue;

    await prisma.seller.create({
      data: seller,
    });
  }
}
