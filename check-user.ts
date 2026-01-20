
import prisma from './lib/prisma';

async function checkUser() {
  const userId = 'cmki1ekso0000i4ezi4fhaecm';
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  console.log('User exists:', !!user);
  if (user) {
    console.log('User details:', user);
  } else {
    console.log('Creating user...');
    const newUser = await prisma.user.create({
      data: {
        id: userId,
        email: 'test@example.com',
        name: 'Test User'
      }
    });
    console.log('User created:', newUser);
  }
  await prisma.$disconnect();
}

checkUser().catch(e => {
  console.error('Error:', e);
  prisma.$disconnect();
});
