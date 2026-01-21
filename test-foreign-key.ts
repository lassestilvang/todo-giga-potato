import prisma from '@/lib/prisma';

async function testForeignKeyError() {
  console.log('=== Testing Task Creation with Prisma ===');
  
  try {
    // Try to create a task with invalid foreign key references
    const invalidTask = await prisma.task.create({
      data: {
        name: 'Test Task with Invalid Foreign Key',
        description: 'This should fail',
        listId: 'invalid-list-id-that-does-not-exist',
        userId: 'invalid-user-id-that-does-not-exist',
        priority: 1,
      },
    });
    
    console.log('❌ Unexpected success:', invalidTask);
  } catch (error) {
    console.log('✅ Caught expected error:');
    console.error(error);
  }
  
  try {
    // Try to create a task with valid user but invalid list
    const testUser = await prisma.user.findFirst();
    if (testUser) {
      console.log(`\n=== Creating task with valid user (${testUser.id}) but invalid list ===`);
      
      const taskWithInvalidList = await prisma.task.create({
        data: {
          name: 'Test Task with Invalid List',
          description: 'This should fail due to invalid list',
          listId: 'invalid-list-id',
          userId: testUser.id,
          priority: 1,
        },
      });
      
      console.log('❌ Unexpected success:', taskWithInvalidList);
    } else {
      console.log('\n⚠️  No existing users found in database');
    }
  } catch (error) {
    console.log('✅ Caught expected error:');
    console.error(error);
  }
  
  // Show existing data for debugging
  try {
    console.log('\n=== Existing Users ===');
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
    users.forEach(user => console.log(`- ${user.name} (${user.email}) [${user.id}]`));
    
    console.log('\n=== Existing Lists ===');
    const lists = await prisma.list.findMany({ include: { user: true } });
    console.log('Lists found:', lists.length);
    lists.forEach(list => console.log(`- ${list.name} (${list.emoji}) [${list.id}] - User: ${list.userId}`));
    
    console.log('\n=== Existing Tasks ===');
    const tasks = await prisma.task.findMany({ include: { list: true, user: true } });
    console.log('Tasks found:', tasks.length);
  } catch (error) {
    console.log('Error fetching existing data:', error);
  }
}

testForeignKeyError()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
