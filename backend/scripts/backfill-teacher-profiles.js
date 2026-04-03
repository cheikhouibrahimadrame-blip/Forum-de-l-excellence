const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

async function main() {
  const prisma = new PrismaClient();

  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER' },
      include: { teacher: true }
    });

    const missingProfiles = teachers.filter((user) => !user.teacher);

    if (missingProfiles.length === 0) {
      console.log('No missing teacher profiles found.');
      return;
    }

    console.log(`Found ${missingProfiles.length} missing teacher profiles.`);

    for (const user of missingProfiles) {
      const employeeId = `TCH-${crypto.randomUUID().slice(0, 8)}`;
      const created = await prisma.teacher.create({
        data: {
          userId: user.id,
          employeeId,
          hireDate: new Date(),
          qualifications: []
        }
      });

      console.log('Created teacher profile:', {
        userId: user.id,
        teacherId: created.id,
        employeeId
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
