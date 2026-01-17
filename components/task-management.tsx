"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Plus, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TaskCard } from "@/components/task-card"
import { TaskForm } from "@/components/task-form"
import { TaskDetails } from "@/components/task-details"
import { TaskView } from "@/components/task-view"
import { TaskWithRelations, LabelWithRelations, ListWithRelations } from "@/lib/types/api"

interface TaskManagementProps {
  activeView: "today" | "next7days" | "upcoming" | "all"
  activeListId: string | null
  activeLabelId: string | null
}

export function TaskManagement({
  activeView,
  activeListId,
  activeLabelId,
}: TaskManagementProps) {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])
  const [labels, setLabels] = useState<LabelWithRelations[]>([])
  const [lists, setLists] = useState<ListWithRelations[]>([])
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskWithRelations | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch tasks, labels, and lists from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch tasks
        const tasksResponse = await fetch("/api/tasks?limit=1000")
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setTasks(tasksData.data || [])
        }

        // Fetch labels
        const labelsResponse = await fetch("/api/labels")
        if (labelsResponse.ok) {
          const labelsData = await labelsResponse.json()
          setLabels(labelsData || [])
        }

        // Fetch lists
        const listsResponse = await fetch("/api/lists")
        if (listsResponse.ok) {
          const listsData = await listsResponse.json()
          setLists(listsData || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesPriority = !filterPriority || task.priority.toString() === filterPriority
    return matchesSearch && matchesPriority
  })

  const handleCreateTask = async (data: any) => {
    try {
      const taskData: any = {
        name: data.name,
        description: data.description || undefined,
        estimates: data.estimates ? parseInt(data.estimates) : undefined,
        actualTime: data.actualTime ? parseInt(data.actualTime) : undefined,
        priority: parseInt(data.priority),
        isRecurring: data.isRecurring || false,
        recurringPattern: data.recurringPattern || undefined,
        listId: "cmki1eksp0001i4eznnccov1s", // Use actual inbox list ID from API
        userId: "cmki1ekso0000i4ezi4fhaecm", // TODO: Replace with actual user ID
      }

      // Only add date fields if they have values
      if (data.date && data.date.trim()) {
        taskData.date = new Date(data.date).toISOString()
      }

      if (data.deadline && data.deadline.trim()) {
        taskData.deadline = new Date(data.deadline).toISOString()
      }

      // Add labels if selected
      if (data.labels && data.labels.length > 0) {
        taskData.labels = {
          connect: data.labels.map((labelId: string) => ({ id: labelId }))
        }
      }

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        throw new Error("Failed to create task")
      }

      const newTask = await response.json()
      setTasks(prev => [...prev, newTask])
    } catch (error) {
      console.error("Error creating task:", error)
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completedAt: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, completedAt: new Date() } : task
        ))
      }
    } catch (error) {
      console.error("Error completing task:", error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
        setSelectedTask(null)
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const handleEditTask = (task: TaskWithRelations) => {
    setSelectedTask(task)
  }

  return (
    <>
      {/* Task View with Filters */}
      <TaskView
        tasks={tasks}
        activeView={activeView}
        activeListId={activeListId}
        activeLabelId={activeLabelId}
        onComplete={handleCompleteTask}
        onEdit={handleEditTask}
        onDelete={handleDeleteTask}
        availableLabels={labels}
        availableLists={lists}
      />

      {/* Create Task Form */}
      <TaskForm
        isOpen={isCreateFormOpen}
        onOpenChange={setIsCreateFormOpen}
        onSubmit={handleCreateTask}
        availableLabels={labels}
      />

      {/* Task Details Modal */}
      {selectedTask && (
        <TaskDetails
          task={selectedTask}
          isOpen={!!selectedTask}
          onOpenChange={() => setSelectedTask(null)}
          onComplete={handleCompleteTask}
          onDelete={handleDeleteTask}
          availableLabels={labels}
        />
      )}
    </>
  )
}
