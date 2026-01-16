#!/usr/bin/env bun
import prisma from '../lib/prisma';

async function initializeDatabase() {
  console.log('Initializing database...');

  try {
    // Check if we need to create default data
    const existingUsers = await prisma.user.count();
    
    if (existingUsers === 0) {
      console.log('Creating default user and data...');
      
      const defaultUser = await prisma.user.create({
        data: {
          email: 'demo@example.com',
          name: 'Demo User',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
          lists: {
            create: [
              {
                name: 'Inbox',
                emoji: '📥',
                color: '#6366f1',
                isDefault: true,
                isFavorite: true,
              },
              {
                name: 'Today',
                emoji: '☀️',
                color: '#10b981',
                isFavorite: true,
              },
              {
                name: 'Work',
                emoji: '💼',
                color: '#f59e0b',
                isFavorite: true,
              },
              {
                name: 'Personal',
                emoji: '🏠',
                color: '#ec4899',
                isFavorite: true,
              },
              {
                name: 'Shopping',
                emoji: '🛒',
                color: '#3b82f6',
              },
            ],
          },
          labels: {
            create: [
              {
                name: 'High Priority',
                color: '#ef4444',
              },
              {
                name: 'Urgent',
                color: '#f59e0b',
              },
              {
                name: 'Important',
                color: '#3b82f6',
              },
              {
                name: 'Low',
                color: '#8b5cf6',
              },
            ],
          },
        },
        include: {
          lists: true,
          labels: true,
        },
      });

      console.log('Default user created:', defaultUser.email);
      
      // Create sample tasks for inbox
      const inboxList = defaultUser.lists.find(list => list.isDefault);
      
      if (inboxList) {
        const sampleTasks = [
          {
            name: 'Review project requirements',
            description: 'Analyze and document all project requirements',
            priority: 2,
            estimates: 120, // 2 hours
            reminders: {
              create: [
                { datetime: new Date(Date.now() + 3600000) }, // 1 hour from now
              ],
            },
            labels: {
              connect: [
                { id: defaultUser.labels.find(l => l.name === 'High Priority')!.id },
              ],
            },
          },
          {
            name: 'Buy groceries',
            description: 'Milk, eggs, bread, and vegetables',
            estimates: 60,
            reminders: {
              create: [
                { datetime: new Date(Date.now() + 86400000) }, // 24 hours from now
              ],
            },
            labels: {
              connect: [
                { id: defaultUser.labels.find(l => l.name === 'Important')!.id },
              ],
            },
          },
          {
            name: 'Schedule team meeting',
            description: 'Coordinate with team members for weekly sync',
            priority: 1,
            estimates: 30,
            reminders: {
              create: [
                { datetime: new Date(Date.now() + 1800000) }, // 30 minutes from now
              ],
            },
            labels: {
              connect: [
                { id: defaultUser.labels.find(l => l.name === 'Urgent')!.id },
              ],
            },
          },
        ];

        await Promise.all(
          sampleTasks.map(taskData =>
            prisma.task.create({
              data: {
                ...taskData,
                listId: inboxList.id,
                userId: defaultUser.id,
              },
            })
          )
        );

        console.log('Sample tasks created:', sampleTasks.length);
      }
    } else {
      console.log('Database already contains users. Skipping initialization.');
    }

    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initializeDatabase();
