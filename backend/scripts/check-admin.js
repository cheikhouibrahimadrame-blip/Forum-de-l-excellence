const { PrismaClient } = require('@prisma/client');
(async function(){
  const prisma = new PrismaClient();
  try{
    const u = await prisma.user.findUnique({ where: { email: 'khaliloullah6666@gmail.com' } });
    if(!u) {
      console.log('missing');
    } else {
      console.log('exists');
      console.log(JSON.stringify({id:u.id,email:u.email,role:u.role,isActive:u.isActive}, null, 2));
    }
  } catch(e){
    console.error('ERR', e.message);
    process.exitCode = 1;
  } finally{
    await prisma.$disconnect();
  }
})();