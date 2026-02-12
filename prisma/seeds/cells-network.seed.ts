import { PrismaClient } from '@prisma/client';

export async function seedCellsNetwork(prisma: PrismaClient) {
  const networks = [
    {
      id: 'clz8x9r1n00193b6p8u2v1w0x',
      name: 'Igreja Viva em Células',
      supervisorId: 'clz8x9r1n00003b6p7z2k9j1a',
      phone: '51936183218',
      active: false,
    },
    {
      id: 'clz8x9r1n000i3b6p4o6p8q0r',
      name: 'Rede Ebenézer',
      supervisorId: 'clz8x9r1n00053b6p8o9p0q1r',
      phone: '51993933325',
      active: false,
    },
    {
      id: 'clz8x9r1n000j3b6p8s0t2u4v',
      name: 'Rede Jardim Regado',
      supervisorId: 'clz8x9r1n00013b6p8q9r4t5u',
      phone: '51982488374',
      active: false,
    },
    {
      id: 'clz8x9r1n00103b6p2w4x6y8z',
      name: 'Rede Vida',
      supervisorId: 'clz8x9r1n00133b6p4i6j8k0l',
      phone: '51985650907',
      active: false,
    },
    {
      id: 'clz8x9r1n00113b6p6a8b0c2d',
      name: 'Rede Viva',
      supervisorId: 'clz8x9r1n000e3b6p8y0z2a4b',
      phone: '51984473633',
      active: false,
    },
    {
      id: 'clz8x9r1n00123b6p0e2f4g6h',
      name: 'Rede Kids',
      supervisorId: 'clz8x9r1n00143b6p8m0n2o4p',
      phone: '51993105627',
      active: false,
    },
  ];

  for (const network of networks) {
    const exists = await prisma.cellNetwork.findFirst({
      where: { id: network.id },
    });

    if (exists) continue;

    await prisma.cellNetwork.create({
      data: network,
    });
  }
}
