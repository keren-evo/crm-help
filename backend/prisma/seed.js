const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Ensure counter row exists for ticket numbering
  await prisma.counter.upsert({
    where: { name: 'ticket' },
    update: {},
    create: { name: 'ticket', value: 0 },
  });

  console.log('Seed complete: Counter initialized');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
