"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Filter, ChevronDown, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { TaskCard } from "@/components/task-card"
import { TaskWithRelations } from "@/lib/types/api"

type ViewType = "today" | "next7days" | "upcoming" | "all"

type SortBy = "date" | "priority" | "name" | "createdAt"

interface TaskViewProps {
  tasks: TaskWithRelations[]
  activeView: ViewType
  activeListId: string | null
  activeLabelId: string | null
  onComplete: (taskId: string) => void
  onEdit: (task: TaskWithRelations) => void
  onDelete: (taskId: string) => void
  availableLabels: any[]
  availableLists: any[]
}

export function TaskView({
  tasks,
  activeView,
  activeListId,
  activeLabelId,
  onComplete,
  onEdit,
  onDelete,
  availableLabels,
  availableLists,
}: TaskViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterPriority, setFilterPriority] = useState<string | null>(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [sortBy, setSortBy] = useState<SortBy>("date")
  const [filterLabel, setFilterLabel] = useState<string | null>(null)
  const [filterList, setFilterList] = useState<string | null>(null)

  // Get today's date at 00:00:00 for consistent date comparisons
  const today = useMemo(() => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    return date
  }, [])

  // Filter tasks based on view, search, and other filters
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Filter by completed status
      if (!showCompleted && task.completedAt) {
        return false
      }

      // Filter by search query
      const matchesSearch = !searchQuery || 
        task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

      // Filter by priority
      const matchesPriority = !filterPriority || task.priority.toString() === filterPriority

      // Filter by list
      const matchesList = !filterList || task.listId === filterList

      // Filter by label
      const matchesLabel = !filterLabel || task.labels.some(label => label.id === filterLabel)

      // Filter by active list (from sidebar)
      const matchesActiveList = !activeListId || task.listId === activeListId

      // Filter by active label (from sidebar)
      const matchesActiveLabel = !activeLabelId || task.labels.some(label => label.id === activeLabelId)

      // Filter by date based on active view
      let matchesDate = true
      
      if (activeView === "today") {
        if (!task.date) return false
        const taskDate = new Date(task.date)
        taskDate.setHours(0, 0, 0, 0)
        matchesDate = taskDate.getTime() === today.getTime()
      } else if (activeView === "next7days") {
        if (!task.date) return false
        const taskDate = new Date(task.date)
        taskDate.setHours(0, 0, 0, 0)
        const endDate = new Date(today)
        endDate.setDate(today.getDate() + 7)
        matchesDate = taskDate >= today && taskDate <= endDate
      } else if (activeView === "upcoming") {
        if (!task.date) return false
        const taskDate = new Date(task.date)
        taskDate.setHours(0, 0, 0, 0)
        matchesDate = taskDate >= today
      }

      return matchesSearch && matchesPriority && matchesList && matchesLabel && 
             matchesActiveList && matchesActiveLabel && matchesDate
    })
  }, [
    tasks,
    activeView,
    activeListId,
    activeLabelId,
    searchQuery,
    filterPriority,
    filterLabel,
    filterList,
    showCompleted,
    today
  ])

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const tasksToSort = [...filteredTasks]
    
    return tasksToSort.sort((a, b) => {
      switch (sortBy) {
        case "date":
          if (!a.date) return 1
          if (!b.date) return -1
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        
        case "priority":
          return b.priority - a.priority
        
        case "name":
          return a.name.localeCompare(b.name)
        
        case "createdAt":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        
        default:
          return 0
      }
    })
  }, [filteredTasks, sortBy])

  // Get view title and icon
  const getViewInfo = () => {
    switch (activeView) {
      case "today":
        return { title: "Today", icon: Calendar, color: "text-blue-600" }
      case "next7days":
        return { title: "Next 7 Days", icon: Calendar, color: "text-green-600" }
      case "upcoming":
        return { title: "Upcoming", icon: Clock, color: "text-purple-600" }
      case "all":
        return { title: "All Tasks", icon: CheckCircle, color: "text-gray-600" }
      default:
        return { title: "All Tasks", icon: CheckCircle, color: "text-gray-600" }
    }
  }

  const viewInfo = getViewInfo() || { title: "All Tasks", icon: CheckCircle, color: "text-gray-600" }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          {(() => {
            const Icon = viewInfo.icon
            return <Icon className={`h-8 w-8 ${viewInfo.color}`} />
          })()}
          <div>
            <h1 className="text-2xl font-bold text-foreground">{viewInfo.title}</h1>
            <p className="text-sm text-muted-foreground">
              {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>{showCompleted ? "Hide Completed" : "Show Completed"}</span>
          </Button>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap gap-4"
      >
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={filterPriority || "all"} onValueChange={(value) => setFilterPriority(value === "all" ? null : value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="0">None</SelectItem>
            <SelectItem value="1">Low</SelectItem>
            <SelectItem value="2">Medium</SelectItem>
            <SelectItem value="3">High</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterList || "all"} onValueChange={(value) => setFilterList(value === "all" ? null : value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="List" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lists</SelectItem>
            {availableLists.map((list) => (
              <SelectItem key={list.id} value={list.id}>
                {list.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterLabel || "all"} onValueChange={(value) => setFilterLabel(value === "all" ? null : value)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Label" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Labels</SelectItem>
            {availableLabels.map((label) => (
              <SelectItem key={label.id} value={label.id}>
                {label.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Date</SelectItem>
            <SelectItem value="priority">Priority</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="createdAt">Created</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Tasks List */}
      <div className="grid gap-4">
        {sortedTasks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            {(() => {
              const Icon = viewInfo.icon
              return <Icon className={`h-16 w-16 ${viewInfo.color} mx-auto mb-4 opacity-20`} />
            })()}
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterPriority || filterLabel || filterList 
                ? "No tasks match your filters" 
                : `No tasks for ${viewInfo.title.toLowerCase()}`}
            </p>
            <Button 
              variant="ghost" 
              onClick={() => {
                setSearchQuery("")
                setFilterPriority(null)
                setFilterLabel(null)
                setFilterList(null)
              }}
            >
              Clear filters
            </Button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
