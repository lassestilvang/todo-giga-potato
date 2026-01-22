import prisma from '@/lib/prisma';

async function checkDatabase() {
  console.log('=== Database Check ===\n');
  
  try {
    // Check if we can connect to the database
    console.log('Connecting to database...');
    
    // Check Prisma connection
    const prismaVersion = await prisma.$queryRaw`SELECT sqlite_version()`;
    console.log('SQLite version:', prismaVersion[0]['sqlite_version()']);
    
    // Check tables exists
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `;
    console.log('Tables in database:', tables.length);
    tables.forEach((table: any) => console.log(`- ${table.name}`));
    
    // Check existing data
    console.log('\n=== Users ===');
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users`);
    users.forEach(user => {
      console.log(`\nUser ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
    });
    
    console.log('\n=== Lists ===');
    const lists = await prisma.list.findMany();
    console.log(`Found ${lists.length} lists`);
    lists.forEach(list => {
      console.log(`\nList ID: ${list.id}`);
      console.log(`  Name: ${list.name}`);
      console.log(`  User ID: ${list.userId}`);
      console.log(`  Is Default: ${list.isDefault}`);
    });
    
    console.log('\n=== Tasks ===');
    const tasks = await prisma.task.findMany();
    console.log(`Found ${tasks.length} tasks`);
    tasks.forEach(task => {
      console.log(`\nTask ID: ${task.id}`);
      console.log(`  Name: ${task.name}`);
      console.log(`  User ID: ${task.userId}`);
      console.log(`  List ID: ${task.listId}`);
      console.log(`  Parent ID: ${task.parentId}`);
    });
    
    // Check for orphaned records
    console.log('\n=== Checking for Orphaned Records ===');
    
    // Tasks with invalid user IDs
    const tasksWithInvalidUser = await prisma.$queryRaw`
      SELECT t.id, t.name, t.userId 
      FROM Task t 
      LEFT JOIN User u ON t.userId = u.id 
      WHERE u.id IS NULL
    `;
    console.log(`Tasks with invalid user IDs: ${tasksWithInvalidUser.length}`);
    
    // Tasks with invalid list IDs
    const tasksWithInvalidList = await prisma.$queryRaw`
      SELECT t.id, t.name, t.listId 
      FROM Task t 
      LEFT JOIN List l ON t.listId = l.id 
      WHERE l.id IS NULL
    `;
    console.log(`Tasks with invalid list IDs: ${tasksWithInvalidList.length}`);
    
    // Lists with invalid user IDs
    const listsWithInvalidUser = await prisma.$queryRaw`
      SELECT l.id, l.name, l.userId 
      FROM List l 
      LEFT JOIN User u ON l.userId = u.id 
      WHERE u.id IS NULL
    `;
    console.log(`Lists with invalid user IDs: ${listsWithInvalidUser.length}`);
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase().catch(console.error);
