"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  CheckCircle2, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  Tag, 
  Paperclip, 
  MoreHorizontal,
  AlertCircle,
  Clock3,
  GripVertical
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TaskWithRelations } from "@/lib/types/api"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ConfirmationDialog } from "@/components/confirmation-dialog"

interface TaskCardProps {
  task: TaskWithRelations
  onComplete?: (taskId: string) => void
  onEdit?: (task: TaskWithRelations) => void
  onDelete?: (taskId: string) => void
}

export function TaskCard({ task, onComplete, onEdit, onDelete }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 1,
  }
  
  // Calculate subtask completion
  const safeSubtasks = task.subtasks || []
  const completedSubtasks = safeSubtasks.filter(subtask => subtask.completedAt).length
  const subtaskProgress = safeSubtasks.length > 0 
    ? (completedSubtasks / safeSubtasks.length) * 100 
    : 0
  
  // Get priority color
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return "bg-green-100 text-green-700 hover:bg-green-200"
      case 2: return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
      case 3: return "bg-red-100 text-red-700 hover:bg-red-200"
      default: return "bg-gray-100 text-gray-700 hover:bg-gray-200"
    }
  }
  
  // Get priority label
  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1: return "Low"
      case 2: return "Medium"
      case 3: return "High"
      default: return "None"
    }
  }
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      style={style}
      ref={setNodeRef}
    >
      <Card
        className={`p-4 transition-all duration-200 ${
          isHovered 
            ? "shadow-md border-primary/30" 
            : "shadow-sm hover:shadow-md"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Drag Handle */}
            <div className="flex items-center gap-2 mb-2">
              <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors p-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                title="Drag to reorder"
                aria-label="Drag to reorder task"
                tabIndex={0}
              >
                <GripVertical className="h-5 w-5" />
              </button>
            </div>
            {/* Task Header */}
            <div className="flex items-center gap-2 mb-2">
              <h2 className={`font-medium text-base transition-all duration-200 ${
                task.completedAt ? "line-through text-muted-foreground" : "text-foreground"
              }`}>
                {task.name}
              </h2>
              <Badge className={getPriorityColor(task.priority)}>
                {getPriorityLabel(task.priority)}
              </Badge>
            </div>
            
            {/* Task Description */}
            {task.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {task.description}
              </p>
            )}
            
            {/* Task Metadata */}
            <div className="flex flex-wrap items-center gap-2 mb-3 text-sm text-muted-foreground">
              {task.date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(task.date).toLocaleDateString()}</span>
                </div>
              )}
              
              {task.deadline && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(task.deadline).toLocaleString()}</span>
                </div>
              )}
              
              {task.estimates && (
                <div className="flex items-center gap-1">
                  <Clock3 className="h-4 w-4" />
                  <span>{task.estimates} min</span>
                </div>
              )}
              
              {task.labels.length > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  <span>{task.labels.length} label(s)</span>
                </div>
              )}
              
              {task.attachments.length > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-4 w-4" />
                  <span>{task.attachments.length} attachment(s)</span>
                </div>
              )}
            </div>
            
            {/* Subtask Progress */}
            {task.subtasks.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                  <span>Subtasks</span>
                  <span>{completedSubtasks}/{task.subtasks.length} completed</span>
                </div>
                <Progress value={subtaskProgress} className="h-2" />
              </div>
            )}
          </div>
          
          {/* Task Actions */}
          <div className="flex items-center gap-1 ml-2">
            {!task.completedAt && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onComplete?.(task.id)}
                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                title="Mark as complete"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit?.(task)}
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              title="Edit task"
            >
              <Edit className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="More options">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Task"
        description={`Are you sure you want to delete the task "${task.name}"? This action cannot be undone.`}
        onConfirm={() => {
          onDelete?.(task.id)
          setIsDeleteDialogOpen(false)
        }}
      />
    </motion.div>
  )
}
