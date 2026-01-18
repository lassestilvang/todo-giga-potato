"use client"

import React, { useState, useEffect } from "react"
import {
  Layout,
  Calendar,
  CalendarClock,
  Clock,
  CheckSquare,
  Inbox,
  Tag,
  Plus,
  MoreHorizontal,
  X,
  Search,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ListWithRelations, LabelWithRelations, TaskWithRelations } from "@/lib/types/api"
import { ConfirmationDialog } from "@/components/confirmation-dialog"

// List color options
const LIST_COLORS = [
  { name: "Gray", value: "gray", className: "bg-gray-500" },
  { name: "Blue", value: "blue", className: "bg-blue-500" },
  { name: "Green", value: "green", className: "bg-green-500" },
  { name: "Purple", value: "purple", className: "bg-purple-500" },
  { name: "Pink", value: "pink", className: "bg-pink-500" },
  { name: "Orange", value: "orange", className: "bg-orange-500" },
  { name: "Red", value: "red", className: "bg-red-500" },
  { name: "Yellow", value: "yellow", className: "bg-yellow-500" },
]

// Label color options
const LABEL_COLORS = [
  { name: "Blue", value: "blue", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { name: "Green", value: "green", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { name: "Purple", value: "purple", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  { name: "Pink", value: "pink", className: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200" },
  { name: "Orange", value: "orange", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  { name: "Red", value: "red", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  { name: "Yellow", value: "yellow", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  { name: "Gray", value: "gray", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
]

// Default emoji options for lists
const DEFAULT_EMOJIS = ["📝", "💼", "🎯", "📚", "🏠", "⚡", "🌟", "🎨"]

// Types for views
type ViewType = "today" | "next7days" | "upcoming" | "all"

interface SidebarProps {
  activeView: ViewType
  activeListId: string | null
  activeLabelId: string | null
  onViewChange: (view: ViewType) => void
  onListChange: (listId: string) => void
  onLabelChange: (labelId: string) => void
  onAddTask: () => void
}

export function Sidebar({
  activeView,
  activeListId,
  activeLabelId,
  onViewChange,
  onListChange,
  onLabelChange,
  onAddTask,
}: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [lists, setLists] = useState<ListWithRelations[]>([])
  const [labels, setLabels] = useState<LabelWithRelations[]>([])
  const [tasks, setTasks] = useState<TaskWithRelations[]>([])

  // Ensure tasks is always an array before filtering
  const safeTasks = Array.isArray(tasks) ? tasks : []
  const [isAddListDialogOpen, setIsAddListDialogOpen] = useState(false)
  const [isAddLabelDialogOpen, setIsAddLabelDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<ListWithRelations | null>(null)
  const [editingLabel, setEditingLabel] = useState<LabelWithRelations | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      console.log('Starting data fetch');
      try {
        // Fetch lists
        const listsResponse = await fetch("/api/lists");
        if (listsResponse.ok) {
          const listsJson = await listsResponse.json();
          console.log('Lists data:', listsJson);
          setLists(listsJson);
        }
        
        // Fetch labels
        const labelsResponse = await fetch("/api/labels");
        if (labelsResponse.ok) {
          const labelsJson = await labelsResponse.json();
          console.log('Labels data:', labelsJson);
          setLabels(labelsJson);
        }
        
        // Fetch tasks
        const tasksResponse = await fetch("/api/tasks?limit=1000");
        if (tasksResponse.ok) {
          const tasksJson = await tasksResponse.json();
          console.log('Tasks data:', tasksJson);
          setTasks(tasksJson.data || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, [])

  // Fetch lists from API
  const fetchLists = async () => {
    try {
      const response = await fetch("/api/lists")
      if (!response.ok) throw new Error("Failed to fetch lists")
      const data = await response.json()
      setLists(data || []) // API returns array directly
    } catch (error) {
      console.error("Error fetching lists:", error)
    }
  }

  // Fetch labels from API
  const fetchLabels = async () => {
    try {
      const response = await fetch("/api/labels")
      if (!response.ok) throw new Error("Failed to fetch labels")
      const data = await response.json()
      setLabels(data || []) // API returns array directly
    } catch (error) {
      console.error("Error fetching labels:", error)
    }
  }

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks?limit=1000") // Fetch all tasks without pagination
      if (!response.ok) throw new Error("Failed to fetch tasks")
      const data = await response.json()
      setTasks(data.data || []) // Tasks API returns paginated response
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  // Create a new list
  const handleCreateList = async (name: string, emoji: string, color: string) => {
    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          emoji,
          color,
          isDefault: false,
          isFavorite: false,
          userId: "1", // TODO: Replace with actual user ID from auth
        }),
      })

      if (!response.ok) throw new Error("Failed to create list")
      
      const newList = await response.json()
      setLists([...lists, newList])
      setIsAddListDialogOpen(false)
    } catch (error) {
      console.error("Error creating list:", error)
    }
  }

  // Update a list
  const handleUpdateList = async (listId: string, updates: any) => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update list")
      
      const updatedList = await response.json()
      setLists(lists.map(list => 
        list.id === listId ? updatedList : list
      ))
      setEditingList(null)
    } catch (error) {
      console.error("Error updating list:", error)
    }
  }

  // Delete a list
  const handleDeleteList = async (listId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete list")
      
      setLists(lists.filter(list => list.id !== listId))
      setEditingList(null)
    } catch (error) {
      console.error("Error deleting list:", error)
    }
  }

  // Create a new label
  const handleCreateLabel = async (name: string, color: string) => {
    try {
      const response = await fetch("/api/labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          color,
          userId: "1", // TODO: Replace with actual user ID from auth
        }),
      })

      if (!response.ok) throw new Error("Failed to create label")
      
      const newLabel = await response.json()
      setLabels([...labels, newLabel])
      setIsAddLabelDialogOpen(false)
    } catch (error) {
      console.error("Error creating label:", error)
    }
  }

  // Update a label
  const handleUpdateLabel = async (labelId: string, updates: any) => {
    try {
      const response = await fetch(`/api/labels/${labelId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error("Failed to update label")
      
      const updatedLabel = await response.json()
      setLabels(labels.map(label => 
        label.id === labelId ? updatedLabel : label
      ))
      setEditingLabel(null)
    } catch (error) {
      console.error("Error updating label:", error)
    }
  }

  // Delete a label
  const handleDeleteLabel = async (labelId: string) => {
    try {
      const response = await fetch(`/api/labels/${labelId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete label")
      
      setLabels(labels.filter(label => label.id !== labelId))
      setEditingLabel(null)
    } catch (error) {
      console.error("Error deleting label:", error)
    }
  }

  // Get uncompleted task count for a list
  const getUncompletedTaskCount = (listId: string) => {
    return safeTasks.filter(task => task.listId === listId && !task.completedAt).length
  }

  // Get overdue task count for today
  const getOverdueTaskCount = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    return safeTasks.filter(task => {
      if (task.completedAt) return false
      if (!task.deadline) return false
      
      const deadline = new Date(task.deadline)
      deadline.setHours(0, 0, 0, 0)
      
      return deadline < today
    }).length
  }

  // Filter lists based on search query
  const filteredLists = searchQuery 
    ? lists.filter(list => 
        list.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : lists

  // Filter labels based on search query
  const filteredLabels = searchQuery 
    ? labels.filter(label => 
        label.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : labels

  // Calculate task counts for each view
  const getTodayTaskCount = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return safeTasks.filter(task => {
      if (!task.date || task.completedAt) return false
      const taskDate = new Date(task.date)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate.getTime() === today.getTime()
    }).length
  }

  const getNext7DaysTaskCount = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + 7)
    return safeTasks.filter(task => {
      if (!task.date || task.completedAt) return false
      const taskDate = new Date(task.date)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate >= today && taskDate <= endDate
    }).length
  }

  const getUpcomingTaskCount = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return safeTasks.filter(task => {
      if (!task.date || task.completedAt) return false
      const taskDate = new Date(task.date)
      taskDate.setHours(0, 0, 0, 0)
      return taskDate >= today
    }).length
  }

  const getAllTaskCount = () => {
    return safeTasks.filter(task => !task.completedAt).length
  }

  // View options
  const views = [
    { id: "today", label: "Today", icon: Calendar, badge: getTodayTaskCount() },
    { id: "next7days", label: "Next 7 Days", icon: CalendarClock, badge: getNext7DaysTaskCount() },
    { id: "upcoming", label: "Upcoming", icon: Clock, badge: getUpcomingTaskCount() },
    { id: "all", label: "All", icon: CheckSquare, badge: getAllTaskCount() },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div 
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: 260, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden border-r bg-background md:flex flex-col h-screen fixed left-0 top-0 z-40"
      >
        <SidebarContent 
          activeView={activeView}
          activeListId={activeListId}
          activeLabelId={activeLabelId}
          views={views}
          lists={filteredLists}
          labels={filteredLabels}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onViewChange={onViewChange}
          onListChange={onListChange}
          onLabelChange={onLabelChange}
          onAddTask={onAddTask}
          onAddList={() => setIsAddListDialogOpen(true)}
          onAddLabel={() => setIsAddLabelDialogOpen(true)}
          onEditList={setEditingList}
          onEditLabel={setEditingLabel}
          getUncompletedTaskCount={getUncompletedTaskCount}
        />
      </motion.div>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 md:hidden"
          >
            <Layout className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72">
          <SidebarContent 
            activeView={activeView}
            activeListId={activeListId}
            activeLabelId={activeLabelId}
            views={views}
            lists={filteredLists}
            labels={filteredLabels}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onViewChange={(view) => {
              onViewChange(view)
              setIsMobileMenuOpen(false)
            }}
            onListChange={(listId) => {
              onListChange(listId)
              setIsMobileMenuOpen(false)
            }}
            onLabelChange={(labelId) => {
              onLabelChange(labelId)
              setIsMobileMenuOpen(false)
            }}
            onAddTask={onAddTask}
            onAddList={() => setIsAddListDialogOpen(true)}
            onAddLabel={() => setIsAddLabelDialogOpen(true)}
            onEditList={setEditingList}
            onEditLabel={setEditingLabel}
            getUncompletedTaskCount={getUncompletedTaskCount}
          />
        </SheetContent>
      </Sheet>

      {/* Add/Edit List Dialog */}
      <Dialog open={isAddListDialogOpen || editingList !== null} onOpenChange={(open) => {
        if (!open) {
          setIsAddListDialogOpen(false)
          setEditingList(null)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingList ? "Edit List" : "Create New List"}</DialogTitle>
            <DialogDescription>
              {editingList ? "Update your list details" : "Add a new list to organize your tasks"}
            </DialogDescription>
          </DialogHeader>
          <ListDialogForm 
            initialData={editingList}
            onSubmit={(data) => {
              if (editingList) {
                handleUpdateList(editingList.id, data)
              } else {
                handleCreateList(data.name, data.emoji, data.color)
              }
            }}
            onDelete={editingList ? () => handleDeleteList(editingList.id) : undefined}
          />
        </DialogContent>
      </Dialog>

      {/* Add/Edit Label Dialog */}
      <Dialog open={isAddLabelDialogOpen || editingLabel !== null} onOpenChange={(open) => {
        if (!open) {
          setIsAddLabelDialogOpen(false)
          setEditingLabel(null)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLabel ? "Edit Label" : "Create New Label"}</DialogTitle>
            <DialogDescription>
              {editingLabel ? "Update your label details" : "Add a new label to categorize your tasks"}
            </DialogDescription>
          </DialogHeader>
          <LabelDialogForm 
            initialData={editingLabel}
            onSubmit={(data) => {
              if (editingLabel) {
                handleUpdateLabel(editingLabel.id, data)
              } else {
                handleCreateLabel(data.name, data.color)
              }
            }}
            onDelete={editingLabel ? () => handleDeleteLabel(editingLabel.id) : undefined}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

// Sidebar content component (shared between desktop and mobile)
interface SidebarContentProps {
  activeView: ViewType
  activeListId: string | null
  activeLabelId: string | null
  views: any[]
  lists: ListWithRelations[]
  labels: LabelWithRelations[]
  searchQuery: string
  setSearchQuery: (query: string) => void
  onViewChange: (view: ViewType) => void
  onListChange: (listId: string) => void
  onLabelChange: (labelId: string) => void
  onAddTask: () => void
  onAddList: () => void
  onAddLabel: () => void
  onEditList: (list: ListWithRelations) => void
  onEditLabel: (label: LabelWithRelations) => void
  getUncompletedTaskCount: (listId: string) => number
}

function SidebarContent({
  activeView,
  activeListId,
  activeLabelId,
  views,
  lists,
  labels,
  searchQuery,
  setSearchQuery,
  onViewChange,
  onListChange,
  onLabelChange,
  onAddTask,
  onAddList,
  onAddLabel,
  onEditList,
  onEditLabel,
  getUncompletedTaskCount,
}: SidebarContentProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo and App Name */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">Daily Tasks</h1>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onAddTask}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search lists and labels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2"
          />
        </div>
      </div>

      {/* Views Section */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
            Views
          </h2>
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {views.map((view) => (
                <motion.button
                  key={view.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => onViewChange(view.id as ViewType)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onViewChange(view.id as ViewType);
                    }
                  }}
                  className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    activeView === view.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  role="menuitem"
                  aria-label={view.label}
                  tabIndex={0}
                >
                  <view.icon className="h-4 w-4 mr-3" />
                  <span className="flex-1">{view.label}</span>
                  {view.badge > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {view.badge}
                      </Badge>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Lists Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lists
            </h2>
            <Button variant="ghost" size="icon" onClick={onAddList}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {lists.map((list) => (
                <motion.div
                  key={list.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  <button
                    onClick={() => onListChange(list.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onListChange(list.id);
                      }
                    }}
                    className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      activeListId === list.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    role="menuitem"
                    aria-label={list.name}
                    tabIndex={0}
                  >
                    <span className="mr-3">{list.emoji || "📝"}</span>
                    <span className="flex-1">{list.name}</span>
                    {getUncompletedTaskCount(list.id) > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {getUncompletedTaskCount(list.id)}
                        </Badge>
                      </motion.div>
                    )}
                    <div
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditList(list)
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Labels Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Labels
            </h2>
            <Button variant="ghost" size="icon" onClick={onAddLabel}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-1">
            <AnimatePresence mode="popLayout">
              {labels.map((label) => (
                <motion.div
                  key={label.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  <button
                    onClick={() => onLabelChange(label.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onLabelChange(label.id);
                      }
                    }}
                    className={`flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      activeLabelId === label.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                    role="menuitem"
                    aria-label={label.name}
                    tabIndex={0}
                  >
                    <Tag className="h-4 w-4 mr-3" />
                    <span className="flex-1">{label.name}</span>
                    <div
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditLabel(label)
                      }}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </div>
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <Button 
          className="w-full"
          onClick={onAddTask}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>
    </div>
  )
}

// List dialog form component
interface ListDialogFormProps {
  initialData?: ListWithRelations | null
  onSubmit: (data: { name: string; emoji: string; color: string }) => void
  onDelete?: () => void
}

function ListDialogForm({ initialData, onSubmit, onDelete }: ListDialogFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [emoji, setEmoji] = useState(initialData?.emoji || DEFAULT_EMOJIS[0])
  const [color, setColor] = useState(initialData?.color || "blue")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    onSubmit({
      name: name.trim(),
      emoji,
      color,
    })
  }

  const handleDelete = async () => {
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    onDelete?.()
    setIsDeleting(false)
    setIsDeleteDialogOpen(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">List Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Work Tasks"
          className="mt-1"
        />
      </div>

      <div>
        <Label>Emoji</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {DEFAULT_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-lg transition-colors ${
                emoji === e ? "bg-primary/20 border border-primary" : "hover:bg-muted"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {LIST_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                color === c.value ? "ring-2 ring-offset-2 ring-primary" : ""
              } ${c.className}`}
              title={c.name}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {initialData ? "Save Changes" : "Create List"}
        </Button>
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete List"
        description={`Are you sure you want to delete the list "${initialData?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </form>
  )
}

// Label dialog form component
interface LabelDialogFormProps {
  initialData?: LabelWithRelations | null
  onSubmit: (data: { name: string; color: string }) => void
  onDelete?: () => void
}

function LabelDialogForm({ initialData, onSubmit, onDelete }: LabelDialogFormProps) {
  const [name, setName] = useState(initialData?.name || "")
  const [color, setColor] = useState(initialData?.color || "blue")
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    onSubmit({
      name: name.trim(),
      color,
    })
  }

  const handleDelete = async () => {
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    onDelete?.()
    setIsDeleting(false)
    setIsDeleteDialogOpen(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Label Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Important"
          className="mt-1"
        />
      </div>

      <div>
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {LABEL_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setColor(c.value)}
              className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
                color === c.value ? "ring-2 ring-offset-2 ring-primary" : ""
              } ${c.className}`}
              title={c.name}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {initialData ? "Save Changes" : "Create Label"}
        </Button>
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Label"
        description={`Are you sure you want to delete the label "${initialData?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </form>
  )
}
