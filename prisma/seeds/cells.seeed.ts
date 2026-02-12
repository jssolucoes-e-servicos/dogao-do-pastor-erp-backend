import { PrismaClient } from '@prisma/client';

export async function seedCells(prisma: PrismaClient) {
  const cells = [
    {
      id: 'clz8x9r1n001a3b6p9y8x7v6u',
      name: 'Igreja Viva em Células',
      leaderId: 'clz8x9r1n00003b6p7z2k9j1a',
      networkId: 'clz8x9r1n00193b6p8u2v1w0x',
      active: false,
    },
    {
      id: 'clz8x9r1n001b3b6p0a1b2c3d',
      name: 'Ebenézer 1',
      leaderId: 'clz8x9r1n00053b6p8o9p0q1r',
      networkId: 'clz8x9r1n000i3b6p4o6p8q0r',
      active: false,
    },
    {
      id: 'clz8x9r1n001c3b6p4e5f6g7h',
      name: 'Ebenézer 2',
      leaderId: 'clz8x9r1n00063b6p2s3t4u5v',
      networkId: 'clz8x9r1n000i3b6p4o6p8q0r',
      active: false,
    },
    {
      id: 'clz8x9r1n001d3b6p8i9j0k1l',
      name: 'Ebenézer 3',
      leaderId: 'clz8x9r1n00073b6p6w7x8y9z',
      networkId: 'clz8x9r1n000i3b6p4o6p8q0r',
      active: false,
    },
    {
      id: 'clz8x9r1n001e3b6p2m3n4o5p',
      name: 'Ebenézer 4',
      leaderId: 'clz8x9r1n00083b6p0a2b4c6d',
      networkId: 'clz8x9r1n000i3b6p4o6p8q0r',
      active: false,
    },
    {
      id: 'clz8x9r1n001f3b6p6q7r8s9t',
      name: 'Ebenézer 5',
      leaderId: 'clz8x9r1n00093b6p8e0f2g4h',
      networkId: 'clz8x9r1n000i3b6p4o6p8q0r',
      active: false,
    },
    {
      id: 'clz8x9r1n001g3b6p0u1v2w3x',
      name: 'Jardim Regado 1',
      leaderId: 'clz8x9r1n00023b6p9w8v7u6t',
      networkId: 'clz8x9r1n000j3b6p8s0t2u4v',
      active: false,
    },
    {
      id: 'clz8x9r1n001i3b6p8c9d0e1f',
      name: 'Jardim Regado 2',
      leaderId: 'clz8x9r1n00043b6p4k5l6m7n',
      networkId: 'clz8x9r1n000j3b6p8s0t2u4v',
      active: false,
    },
    {
      id: 'clz8x9r1n001h3b6p4y5z6a7b',
      name: 'Jardim Regado 3',
      leaderId: 'clz8x9r1n00033b6p0m1n2o3p',
      networkId: 'clz8x9r1n000j3b6p8s0t2u4v',
      active: false,
    },
    {
      id: 'clz8x9r1n001j3b6p2g3h4i5j',
      name: 'Rede Jovens',
      leaderId: 'clz8x9r1n000a3b6p2i4j6k8l',
      networkId: 'clz8x9r1n00103b6p2w4x6y8z',
      active: false,
    },
    {
      id: 'clz8x9r1n001k3b6p6k7l8m9n',
      name: 'Aba',
      leaderId: 'clz8x9r1n000c3b6p0q2r4s6t',
      networkId: 'clz8x9r1n00103b6p2w4x6y8z',
      active: false,
    },
    {
      id: 'clz8x9r1n001l3b6p0o1p2q3r',
      name: 'Emaús',
      leaderId: 'clz8x9r1n000b3b6p6m8n0o2p',
      networkId: 'clz8x9r1n00103b6p2w4x6y8z',
      active: false,
    },
    {
      id: 'clz8x9r1n001m3b6p4s5t6u7v',
      name: 'Ágape',
      leaderId: 'clz8x9r1n000d3b6p4u6v8w0x',
      networkId: 'clz8x9r1n00103b6p2w4x6y8z',
      active: false,
    },

    {
      id: 'clz8x9r1n001n3b6p8w9x0y1z',
      name: 'Viva 1',
      leaderId: 'clz8x9r1n000e3b6p8y0z2a4b',
      networkId: 'clz8x9r1n00113b6p6a8b0c2d',
      active: false,
    },
    {
      id: 'clz8x9r1n001o3b6p2a3b4c5d',
      name: 'Viva 2',
      leaderId: 'clz8x9r1n000f3b6p2c4d6e8f',
      networkId: 'clz8x9r1n00113b6p6a8b0c2d',
      active: false,
    },
  ];

  for (const cell of cells) {
    const exists = await prisma.cell.findFirst({
      where: { id: cell.id },
    });

    if (exists) continue;

    await prisma.cell.create({
      data: cell,
    });
  }
}
