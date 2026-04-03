import { PrismaClient } from '@prisma/client';

console.log('Creating Prisma client...');
const prisma = new PrismaClient();

console.log('Prisma client created successfully');
console.log('Testing database connection...');

prisma.$connect()
  .then(() => {
    console.log('✅ Connected to database!');
    return prisma.user.count();
  })
  .then((count) => {
    console.log(`Found ${count} users in database`);
    return prisma.$disconnect();
  })
  .then(() => {
    console.log('✅ Disconnected from database');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
