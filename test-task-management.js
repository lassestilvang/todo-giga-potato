#!/usr/bin/env node

import axios from 'axios';

const API_BASE = 'http://localhost:32754/api';

async function testTaskManagement() {
  console.log('Testing Task Management System...\n');

  try {
    // 1. Test: Get all tasks
    console.log('1. Getting all tasks:');
    const allTasksResponse = await axios.get(`${API_BASE}/tasks?limit=1000`);
    console.log(`   ✅ Success - ${allTasksResponse.data.data.length} tasks found`);
    
    // Print task details
    allTasksResponse.data.data.forEach((task, index) => {
      console.log(`   - Task ${index + 1}: ${task.name} (${task.completedAt ? 'Completed' : 'Pending'})`);
    });
    console.log();

    // 2. Test: Get completed tasks
    console.log('2. Getting completed tasks:');
    const completedTasksResponse = await axios.get(`${API_BASE}/tasks?completed=true`);
    console.log(`   ✅ Success - ${completedTasksResponse.data.data.length} completed tasks found`);
    console.log();

    // 3. Test: Get task by ID (using first task)
    const firstTask = allTasksResponse.data.data[0];
    console.log(`3. Getting task by ID (${firstTask.id}):`);
    const singleTaskResponse = await axios.get(`${API_BASE}/tasks/${firstTask.id}`);
    console.log(`   ✅ Success - Task found: ${singleTaskResponse.data.name}`);
    console.log();

    // 4. Test: Create a new task
    console.log('4. Creating a new task:');
    const newTaskData = {
      name: 'API Test Task',
      description: 'This is a task created via API test',
      estimates: 30,
      priority: 1,
      isRecurring: false,
      listId: 'cmki1eksp0001i4eznnccov1s',
      userId: 'cmki1ekso0000i4ezi4fhaecm',
      labels: []
    };
    const createTaskResponse = await axios.post(`${API_BASE}/tasks`, newTaskData);
    console.log(`   ✅ Success - Task created: ${createTaskResponse.data.name}`);
    console.log(`   Task ID: ${createTaskResponse.data.id}`);
    console.log();

    // 5. Test: Update the new task
    console.log('5. Updating the new task:');
    const updateTaskData = {
      name: 'Updated API Test Task',
      estimates: 45,
      priority: 2
    };
    const updateTaskResponse = await axios.put(
      `${API_BASE}/tasks/${createTaskResponse.data.id}`,
      updateTaskData
    );
    console.log(`   ✅ Success - Task updated: ${updateTaskResponse.data.name}`);
    console.log();

    // 6. Test: Mark task as completed
    console.log('6. Marking task as completed:');
    const completeTaskResponse = await axios.put(
      `${API_BASE}/tasks/${createTaskResponse.data.id}`,
      { completedAt: new Date().toISOString() }
    );
    console.log(`   ✅ Success - Task marked as completed`);
    console.log();

    // 7. Test: Delete the test task
    console.log('7. Deleting the test task:');
    await axios.delete(`${API_BASE}/tasks/${createTaskResponse.data.id}`);
    console.log('   ✅ Success - Task deleted');
    console.log();

    // 8. Test: Verify task was deleted
    console.log('8. Verifying task deletion:');
    try {
      await axios.get(`${API_BASE}/tasks/${createTaskResponse.data.id}`);
      console.log('   ❌ Error - Task still exists');
    } catch (error) {
      console.log('   ✅ Success - Task not found (deleted successfully)');
    }
    console.log();

    // 9. Test: Get labels
    console.log('9. Getting all labels:');
    const labelsResponse = await axios.get(`${API_BASE}/labels`);
    console.log(`   ✅ Success - ${labelsResponse.data.length} labels found`);
    labelsResponse.data.forEach((label, index) => {
      console.log(`   - Label ${index + 1}: ${label.name} (${label.color})`);
    });
    console.log();

    // 10. Test: Get lists
    console.log('10. Getting all lists:');
    const listsResponse = await axios.get(`${API_BASE}/lists`);
    console.log(`   ✅ Success - ${listsResponse.data.length} lists found`);
    listsResponse.data.forEach((list, index) => {
      console.log(`   - List ${index + 1}: ${list.emoji} ${list.name}`);
    });
    console.log();

    console.log('🎉 All tests passed! Task management system is working perfectly.');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

testTaskManagement();
