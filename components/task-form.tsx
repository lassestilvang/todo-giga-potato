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
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { SubtaskList } from "@/components/subtask-list"
import { TaskWithRelations } from "@/lib/types/api"
import * as z from "zod"

// Form validation schema
const taskFormSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  description: z.string().optional(),
  date: z.string().optional(),
  deadline: z.string().optional(),
  estimates: z.string().optional(),
  actualTime: z.string().optional(),
  priority: z.string().default("0"),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional(),
  labels: z.array(z.string()).default([]),
})

interface TaskFormProps {
  task?: TaskWithRelations
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
  availableLabels: any[]
}

export function TaskForm({ 
  task, 
  isOpen, 
  onOpenChange, 
  onSubmit,
  availableLabels 
}: TaskFormProps) {
  const [formData, setFormData] = useState({
    name: task?.name || "",
    description: task?.description || "",
    date: task?.date ? new Date(task.date).toISOString().split("T")[0] : "",
    deadline: task?.deadline ? new Date(task.deadline).toISOString().split("T")[0] : "",
    estimates: task?.estimates?.toString() || "",
    actualTime: task?.actualTime?.toString() || "",
    priority: task?.priority?.toString() || "0",
    isRecurring: task?.isRecurring || false,
    recurringPattern: task?.recurringPattern || "",
    labels: task?.labels?.map(label => label.id) || [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  const handleLabelToggle = (labelId: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.includes(labelId)
        ? prev.labels.filter(id => id !== labelId)
        : [...prev.labels, labelId]
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(prev => [...prev, ...Array.from(e.target.files as FileList)])
    }
  }

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    try {
      taskFormSchema.parse(formData)
      onSubmit(formData)
      onOpenChange(false)
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        err.issues.forEach(issue => {
          if (issue.path.length > 0) {
            newErrors[issue.path[0]] = issue.message
          }
        })
        setErrors(newErrors)
      }
    }
  }

  const recurringPatterns = [
    { value: "daily", label: "Every day" },
    { value: "weekly", label: "Every week" },
    { value: "weekday", label: "Every weekday" },
    { value: "monthly", label: "Every month" },
    { value: "yearly", label: "Every year" },
    { value: "custom", label: "Custom" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{task ? "Edit Task" : "Create Task"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Task Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Task Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Enter task name"
              className={errors.name ? "border-red-500 focus:ring-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Add a description..."
              rows={3}
            />
          </div>

          {/* Date and Time Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange("date", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="deadline">Deadline</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={(e) => handleChange("deadline", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>

          {/* Time Estimates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="estimates">Estimated Time (minutes)</Label>
              <Input
                id="estimates"
                type="number"
                value={formData.estimates}
                onChange={(e) => handleChange("estimates", e.target.value)}
                placeholder="30"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="actualTime">Actual Time (minutes)</Label>
              <Input
                id="actualTime"
                type="number"
                value={formData.actualTime}
                onChange={(e) => handleChange("actualTime", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleChange("priority", value)}
            >
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">None</SelectItem>
                <SelectItem value="1">Low</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Labels */}
          <div className="space-y-1.5">
            <Label>Labels</Label>
            <div className="flex flex-wrap gap-2">
              {availableLabels.map((label) => (
                <Badge
                  key={label.id}
                  className={`cursor-pointer transition-colors ${
                    formData.labels.includes(label.id)
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => handleLabelToggle(label.id)}
                >
                  {label.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Recurring Task */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="isRecurring">Recurring Task</Label>
              <Switch
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => handleChange("isRecurring", checked)}
              />
            </div>
            
            {formData.isRecurring && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
                className="mt-2"
              >
                <Select
                  value={formData.recurringPattern}
                  onValueChange={(value) => handleChange("recurringPattern", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    {recurringPatterns.map((pattern) => (
                      <SelectItem key={pattern.value} value={pattern.value}>
                        {pattern.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}
          </div>

          {/* Subtasks */}
          <div className="space-y-1.5">
            <Label>Subtasks</Label>
            <SubtaskList
              subtasks={task?.subtasks || []}
              onAdd={(name) => console.log("Add subtask:", name)}
              onUpdate={(id, name) => console.log("Update subtask:", id, name)}
              onDelete={(id) => console.log("Delete subtask:", id)}
              onToggle={(id, completed) => console.log("Toggle subtask:", id, completed)}
            />
          </div>

          {/* Attachments */}
          <div className="space-y-1.5">
            <Label>Attachments</Label>
            <div className="space-y-2">
              <Input
                type="file"
                multiple
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              
              {selectedFiles.length > 0 && (
                <div className="space-y-1">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm text-muted-foreground"
                    >
                      <span>{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFile(index)}
                        className="h-6 w-6"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit}>
            {task ? "Save Changes" : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
