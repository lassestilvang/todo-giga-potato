"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Calendar, 
  Clock, 
  Tag, 
  Paperclip, 
  AlertCircle, 
  Repeat, 
  Edit2,
  CheckCircle2,
  Trash2,
  ExternalLink,
  X,
  List as ListIcon,
  CalendarClock
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskHistory } from "@/components/task-history"
import { TaskForm } from "@/components/task-form"
import { SubtaskList } from "@/components/subtask-list"
import { TaskWithRelations } from "@/lib/types/api"
import toast from "react-hot-toast"
import { ConfirmationDialog } from "@/components/confirmation-dialog"

interface TaskDetailsProps {
  task: TaskWithRelations
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: (taskId: string) => void
  onDelete?: (taskId: string) => void
  availableLabels: any[]
}

export function TaskDetails({ 
  task, 
  isOpen, 
  onOpenChange, 
  onComplete, 
  onDelete,
  availableLabels 
}: TaskDetailsProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Calculate subtask completion
  const completedSubtasks = task.subtasks.filter(subtask => subtask.completedAt).length
  const subtaskProgress = task.subtasks.length > 0 
    ? (completedSubtasks / task.subtasks.length) * 100 
    : 0

  // Get priority color
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return "bg-green-100 text-green-700"
      case 2: return "bg-yellow-100 text-yellow-700"
      case 3: return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-700"
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

  if (isEditMode) {
    return (
      <TaskForm
        task={task}
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditMode(false)
            onOpenChange(false)
          }
        }}
        onSubmit={(data) => console.log("Update task:", data)}
        availableLabels={availableLabels}
      />
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-2xl font-bold">{task.name}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="subtasks">Subtasks</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 py-4">
            {/* Task Status and List */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Badge className={getPriorityColor(task.priority)}>
                  {getPriorityLabel(task.priority)}
                </Badge>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <ListIcon className="h-3 w-3" />
                  {task.list.name}
                </Badge>
              </div>
              {!task.completedAt && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onComplete?.(task.id)}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Mark Complete
                </Button>
              )}
            </div>

            {/* Description */}
            {task.description && (
              <div className="space-y-2">
                <h4 className="font-medium text-lg">Description</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {task.description}
                </p>
              </div>
            )}

            {/* Task Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {task.date && (
                <div className="space-y-1.5">
                  <h4 className="font-medium text-sm flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Date
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {new Date(task.date).toLocaleDateString()}
                  </p>
                </div>
              )}

              {task.deadline && (
                <div className="space-y-1.5">
                  <h4 className="font-medium text-sm flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Deadline
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {new Date(task.deadline).toLocaleString()}
                  </p>
                </div>
              )}

              {task.estimates && (
                <div className="space-y-1.5">
                  <h4 className="font-medium text-sm flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Estimated Time
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {task.estimates} minutes
                  </p>
                </div>
              )}

              {task.actualTime && (
                <div className="space-y-1.5">
                  <h4 className="font-medium text-sm flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Actual Time
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {task.actualTime} minutes
                  </p>
                </div>
              )}
            </div>

            {/* Additional Task Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-1.5">
                <h4 className="font-medium text-sm flex items-center gap-1">
                  <CalendarClock className="h-4 w-4" />
                  Created
                </h4>
                <p className="text-muted-foreground text-sm">
                  {new Date(task.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-medium text-sm flex items-center gap-1">
                  <CalendarClock className="h-4 w-4" />
                  Updated
                </h4>
                <p className="text-muted-foreground text-sm">
                  {new Date(task.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Labels */}
            {task.labels.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  Labels
                </h4>
                <div className="flex flex-wrap gap-2">
                  {task.labels.map((label) => (
                    <Badge 
                      key={label.id} 
                      className={`${label.color} text-white hover:opacity-90`}
                    >
                      {label.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recurring Pattern */}
            {task.isRecurring && task.recurringPattern && (
              <div className="space-y-1.5">
                <h4 className="font-medium text-sm flex items-center gap-1">
                  <Repeat className="h-4 w-4" />
                  Recurring
                </h4>
                <p className="text-muted-foreground text-sm">
                  {task.recurringPattern}
                </p>
              </div>
            )}

            {/* Reminders */}
            {task.reminders.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Reminders
                </h4>
                <div className="space-y-2">
                  {task.reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center justify-between text-sm text-muted-foreground p-2 bg-gray-50 rounded-md"
                    >
                      <span>{new Date(reminder.datetime).toLocaleString()}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={async () => {
                          try {
                            const response = await fetch(`/api/reminders/${reminder.id}`, {
                              method: 'DELETE',
                            });
                            if (response.ok) {
                              toast.success("Reminder deleted!")
                              window.location.reload();
                            } else {
                              toast.error("Failed to delete reminder")
                            }
                          } catch (error) {
                            console.error('Error deleting reminder:', error);
                            toast.error("Failed to delete reminder")
                          }
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {task.attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-1">
                  <Paperclip className="h-4 w-4" />
                  Attachments
                </h4>
                <div className="space-y-2">
                  {task.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between text-sm text-muted-foreground p-2 bg-gray-50 rounded-md"
                    >
                      <span>{attachment.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            window.open(attachment.url, '_blank');
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={async () => {
                            try {
                              const response = await fetch(`/api/attachments/${attachment.id}`, {
                                method: 'DELETE',
                              });
                              if (response.ok) {
                                toast.success("Attachment deleted!")
                                window.location.reload();
                              } else {
                                toast.error("Failed to delete attachment")
                              }
                            } catch (error) {
                              console.error('Error deleting attachment:', error);
                              toast.error("Failed to delete attachment")
                            }
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="subtasks" className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-lg">Subtasks</h4>
                <span className="text-sm text-muted-foreground">
                  {completedSubtasks}/{task.subtasks.length} completed
                </span>
              </div>
              <Progress value={subtaskProgress} className="h-2" />
              
              <div className="space-y-2 mt-3">
                <SubtaskList
                  subtasks={task.subtasks}
                  onAdd={(name) => console.log("Add subtask:", name)}
                  onUpdate={(id, name) => console.log("Update subtask:", id, name)}
                  onDelete={(id) => console.log("Delete subtask:", id)}
                  onToggle={(id, completed) => console.log("Toggle subtask:", id, completed)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="py-4">
            <TaskHistory history={task.history} />
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2 pt-4">
          <Button
            variant="ghost"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
          <Button
            variant="ghost"
            onClick={() => setIsEditMode(true)}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Edit2 className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
      
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
    </Dialog>
  )
}
