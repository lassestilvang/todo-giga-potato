import prisma from './prisma';
import type { Task, List, Label, User, Reminder, Attachment } from '@prisma/client';

// Task operations
export async function getTasksByUserId(userId: string) {
  return prisma.task.findMany({
    where: { userId },
    include: {
      list: true,
      labels: true,
      reminders: true,
      attachments: true,
      subtasks: true,
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  });
}

export async function getTaskById(taskId: string) {
  return prisma.task.findFirst({
    where: { id: taskId },
    include: {
      list: true,
      labels: true,
      reminders: true,
      attachments: true,
      subtasks: true,
      history: true,
    },
  });
}

export async function createTask(data: any) {
  const { reminders, labels, attachments, subtasks, ...taskData } = data;
  
  return prisma.task.create({
    data: {
      ...taskData,
      reminders: reminders ? { create: reminders } : undefined,
      labels: labels ? { connect: labels } : undefined,
      attachments: attachments ? { create: attachments } : undefined,
      subtasks: subtasks ? { create: subtasks } : undefined,
    },
    include: {
      list: true,
      labels: true,
      reminders: true,
      attachments: true,
    },
  });
}

export async function updateTask(id: string, data: any) {
  const { reminders, labels, attachments, subtasks, ...taskData } = data;
  
  const updateData: any = { ...taskData };
  
  if (reminders) {
    updateData.reminders = {
      deleteMany: {},
      create: reminders,
    };
  }
  
  if (labels) {
    updateData.labels = {
      set: labels.map((labelId: string) => ({ id: labelId })),
    };
  }
  
  if (attachments) {
    updateData.attachments = {
      deleteMany: {},
      create: attachments,
    };
  }
  
  return prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      list: true,
      labels: true,
      reminders: true,
      attachments: true,
    },
  });
}

export async function deleteTask(id: string) {
  return prisma.task.delete({
    where: { id },
  });
}

// List operations
export async function getListsByUserId(userId: string) {
  return prisma.list.findMany({
    where: { userId },
    orderBy: [
      { isDefault: 'desc' },
      { isFavorite: 'desc' },
      { createdAt: 'asc' },
    ],
    include: {
      tasks: {
        where: { completedAt: null },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      },
    },
  });
}

export async function getListById(listId: string) {
  return prisma.list.findFirst({
    where: { id: listId },
    include: {
      tasks: {
        include: {
          labels: true,
          reminders: true,
          attachments: true,
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' },
        ],
      },
    },
  });
}

export async function createList(data: any) {
  return prisma.list.create({
    data,
  });
}

export async function updateList(id: string, data: any) {
  return prisma.list.update({
    where: { id },
    data,
  });
}

export async function deleteList(id: string) {
  return prisma.list.delete({
    where: { id },
  });
}

// Label operations
export async function getLabelsByUserId(userId: string) {
  return prisma.label.findMany({
    where: { userId },
    orderBy: [
      { name: 'asc' },
    ],
  });
}

export async function createLabel(data: any) {
  return prisma.label.create({
    data,
  });
}

export async function updateLabel(id: string, data: any) {
  return prisma.label.update({
    where: { id },
    data,
  });
}

export async function deleteLabel(id: string) {
  return prisma.label.delete({
    where: { id },
  });
}

// User operations
export async function getUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email },
    include: {
      lists: true,
      labels: true,
    },
  });
}

export async function createUser(data: any) {
  return prisma.user.create({
    data: {
      ...data,
      lists: {
        create: [
          {
            name: 'Inbox',
            emoji: '📥',
            color: '#6366f1',
            isDefault: true,
            isFavorite: true,
          },
        ],
        labels: {
          create: [
            { name: 'High Priority', color: '#ef4444' },
            { name: 'Urgent', color: '#f59e0b' },
            { name: 'Important', color: '#3b82f6' },
            { name: 'Low', color: '#8b5cf6' },
          ],
        },
      },
    },
  });
}

// Attachment operations
export async function createAttachment(data: any) {
  return prisma.attachment.create({
    data,
  });
}

export async function deleteAttachment(id: string) {
  return prisma.attachment.delete({
    where: { id },
  });
}

// Reminder operations
export async function createReminder(data: any) {
  return prisma.reminder.create({
    data,
  });
}

export async function deleteReminder(id: string) {
  return prisma.reminder.delete({
    where: { id },
  });
}

// Task history operations
export async function createTaskHistory(data: any) {
  return prisma.taskHistory.create({
    data,
  });
}

export async function getTaskHistory(taskId: string) {
  return prisma.taskHistory.findMany({
    where: { taskId },
    orderBy: { createdAt: 'desc' },
  });
}
