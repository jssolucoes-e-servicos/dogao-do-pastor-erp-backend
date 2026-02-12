import { PrismaClient } from '@prisma/client';
import { seedCellsNetwork } from './cells-network.seed';
import { seedCells } from './cells.seeed';
import { seedContributors } from './contributors.seed';
import { seedEditions } from './editions.seed';
import { seedPartners } from './partners.seed';
import { seedSellers } from './sellers.seed';

export async function runSeeds(prisma: PrismaClient) {
  await seedEditions(prisma);
  await seedContributors(prisma);
  await seedCellsNetwork(prisma);
  await seedCells(prisma);
  await seedSellers(prisma);
  await seedPartners(prisma);
}
