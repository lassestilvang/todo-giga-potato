import prisma from '@/lib/prisma';

async function testTaskCreation() {
  console.log('=== Testing Task Creation ===');
  
  try {
    // Get the default user and their default list
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('❌ No user found');
      return;
    }
    
    const defaultList = await prisma.list.findFirst({
      where: { userId: user.id, isDefault: true }
    });
    
    if (!defaultList) {
      console.log('❌ No default list found for user');
      return;
    }
    
    console.log(`User: ${user.name} (${user.id})`);
    console.log(`Default List: ${defaultList.name} (${defaultList.id})`);
    
    // Test 1: Create a task with valid user and list IDs
    console.log('\n1. Creating task with valid user and list...');
    const task = await prisma.task.create({
      data: {
        name: 'Test Task from Frontend',
        description: 'This task was created using valid foreign keys',
        listId: defaultList.id,
        userId: user.id,
        priority: 2,
      },
      include: { user: true, list: true }
    });
    
    console.log('✅ Success! Task created:');
    console.log(`- Task: ${task.name} (${task.id})`);
    console.log(`- List: ${task.list.name} (${task.list.id})`);
    console.log(`- User: ${task.user.name} (${task.user.id})`);
    
    // Test 2: Verify task is properly associated
    const foundTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: { list: true, user: true }
    });
    
    console.log('\n2. Verifying task associations...');
    if (foundTask?.userId === user.id && foundTask?.listId === defaultList.id) {
      console.log('✅ Task associations are correct');
    } else {
      console.log('❌ Task associations are incorrect');
    }
    
    // Clean up
    await prisma.task.delete({ where: { id: task.id } });
    console.log('\nCleanup completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTaskCreation();
