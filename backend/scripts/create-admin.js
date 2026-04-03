const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function main() {
  const prisma = new PrismaClient();
  
  // Admin credentials
  const email = 'khaliloullah6666@gmail.com';
  const tempPassword = 'RBFMD5FABJJ';
  
  console.log('Creating admin account...');
  console.log('Email:', email);
  console.log('Temporary Password:', tempPassword);
  console.log('');
  
  const hashed = await bcrypt.hash(tempPassword, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashed,
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: true,
      firstName: 'Admin',
      lastName: 'Principal',
    },
    create: {
      email,
      password: hashed,
      role: 'ADMIN',
      isActive: true,
      mustChangePassword: true,
      firstName: 'Admin',
      lastName: 'Principal',
    },
  });

  console.log('✅ Admin account created/updated successfully!');
  console.log('');
  console.log('Login at: http://localhost:5173/login');
  console.log('Email:', user.email);
  console.log('Password:', tempPassword);
  console.log('');
  console.log('⚠️  You will be forced to change this password on first login.');
  
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
