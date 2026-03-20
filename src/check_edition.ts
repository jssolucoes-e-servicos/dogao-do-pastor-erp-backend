import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const now = new Date();
  console.log('Current Date:', now.toISOString());

  const activeEditions = await prisma.edition.findMany({
    where: { active: true },
    orderBy: { saleStartDate: 'desc' },
  });

  console.log('Active Editions Found:', activeEditions.length);
  activeEditions.forEach((e) => {
    console.log(`- ID: ${e.id}`);
    console.log(`  Name: ${e.name}`);
    console.log(`  Active: ${e.active}`);
    console.log(`  Sale Start: ${e.saleStartDate.toISOString()}`);
    console.log(`  Sale End: ${e.saleEndDate.toISOString()}`);
    console.log(`  Auto Disable: ${e.autoDisableDate?.toISOString()}`);
    console.log(`  Limit Sale: ${e.limitSale}`);
    console.log(`  Dogs Sold: ${e.dogsSold}`);
    const isStrictlyActive = e.active && e.saleStartDate <= now && (!e.autoDisableDate || e.autoDisableDate >= now);
    console.log(`  Is Strictly Active (Helper Logic): ${isStrictlyActive}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
