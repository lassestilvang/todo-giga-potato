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
import toast from "react-hot-toast"

// Recurring pattern validation schema with comprehensive checks
const recurringPatternSchema = z.object({
  type: z.enum(["daily", "weekly", "weekday", "monthly", "yearly", "custom"]).default("daily"),
  interval: z.number().min(1, "Interval must be at least 1").default(1),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  dayOfMonth: z.number().min(1, "Day of month must be between 1 and 31").max(31, "Day of month must be between 1 and 31").optional(),
  month: z.number().min(1, "Month must be between 1 and 12").max(12, "Month must be between 1 and 12").optional(),
  endDate: z.string().optional(),
}).refine(data => {
  if (data.type === "weekly" && (!data.daysOfWeek || data.daysOfWeek.length === 0)) {
    return false
  }
  if (data.type === "custom") {
    return data.daysOfWeek && data.daysOfWeek.length > 0 || data.dayOfMonth || data.month
  }
  return true
}, {
  message: "Please select appropriate recurrence options based on the pattern type",
  path: ["daysOfWeek"],
})

// Form validation schema with comprehensive checks
const taskFormSchema = z.object({
  name: z.string().min(1, "Task name is required").max(255, "Task name must be less than 256 characters"),
  description: z.string().optional().transform(val => val === "" ? undefined : val),
  date: z.string().optional(),
  deadline: z.string().optional(),
  estimates: z.string().optional().transform(val => val === "" ? undefined : val),
  actualTime: z.string().optional().transform(val => val === "" ? undefined : val),
  priority: z.string().default("0").refine(val => ["0", "1", "2", "3"].includes(val), "Priority must be 0, 1, 2, or 3"),
  isRecurring: z.boolean().default(false),
  recurringPattern: recurringPatternSchema.optional(),
  labels: z.array(z.string()).default([]),
  reminders: z.array(z.string()).default([]),
})
.refine(data => {
  if (data.isRecurring && !data.recurringPattern) {
    return false
  }
  return true
}, {
  message: "Recurring pattern is required for recurring tasks",
  path: ["recurringPattern"],
})
.refine(data => {
  if (data.recurringPattern?.endDate && data.date && data.recurringPattern.endDate < data.date) {
    return false
  }
  return true
}, {
  message: "End date must be after start date",
  path: ["recurringPattern", "endDate"],
})
.refine(data => {
  if (data.deadline && data.date && data.deadline < data.date) {
    return false
  }
  return true
}, {
  message: "Deadline must be on or after the task date",
  path: ["deadline"],
})
.refine(data => {
  if (data.estimates && parseInt(data.estimates) < 0) {
    return false
  }
  return true
}, {
  message: "Estimated time must be a non-negative number",
  path: ["estimates"],
})
.refine(data => {
  if (data.actualTime && parseInt(data.actualTime) < 0) {
    return false
  }
  return true
}, {
  message: "Actual time must be a non-negative number",
  path: ["actualTime"],
})
.refine(data => {
  return data.reminders.every(reminder => {
    if (!reminder) return true
    // Validate ISO datetime format (YYYY-MM-DDTHH:MM)
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
    return dateTimeRegex.test(reminder)
  })
}, {
  message: "Reminders must be in valid datetime format (YYYY-MM-DDTHH:MM)",
  path: ["reminders"],
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Parse recurring pattern from task (handle both string and object formats)
  const parseRecurringPattern = (pattern: any) => {
    if (!pattern) {
      return { type: "daily", interval: 1 }
    }
    
    if (typeof pattern === "string") {
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(pattern)
        if (parsed.type) {
          return parsed
        }
        // Handle legacy string format
        return {
          type: pattern as "daily" | "weekly" | "weekday" | "monthly" | "yearly" | "custom",
          interval: 1,
        }
      } catch {
        // Handle legacy string format if parsing fails
        return {
          type: pattern as "daily" | "weekly" | "weekday" | "monthly" | "yearly" | "custom",
          interval: 1,
        }
      }
    }
    
    if (typeof pattern === "object" && pattern.type) {
      return pattern
    }
    
    return { type: "daily", interval: 1 }
  }

  const [formData, setFormData] = useState({
    name: task?.name || "",
    description: task?.description || "",
    date: task?.date ? new Date(task.date).toISOString().split("T")[0] : "",
    deadline: task?.deadline ? new Date(task.deadline).toISOString().split("T")[0] : "",
    estimates: task?.estimates?.toString() || "",
    actualTime: task?.actualTime?.toString() || "",
    priority: task?.priority?.toString() || "0",
    isRecurring: task?.isRecurring || false,
    recurringPattern: parseRecurringPattern(task?.recurringPattern),
    labels: task?.labels?.map(label => label.id) || [],
    reminders: task?.reminders?.map(reminder => new Date(reminder.datetime).toISOString().slice(0, 16)) || [],
  })

  // Define a simpler type for form management
  const [subtasks, setSubtasks] = useState<{ id: string; name: string; completedAt: Date | null }[]>(
    task?.subtasks.map(subtask => ({
      id: subtask.id,
      name: subtask.name,
      completedAt: subtask.completedAt
    })) || []
  )

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

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      taskFormSchema.parse(formData)
      
      // Serialize recurring pattern to JSON string for API
      const submitData = {
        ...formData,
        recurringPattern: JSON.stringify(formData.recurringPattern),
        subtasks: subtasks.map(subtask => ({
          id: subtask.id,
          name: subtask.name,
          completedAt: subtask.completedAt,
        })),
        files: selectedFiles,
      }
      
      await onSubmit(submitData)
      onOpenChange(false)
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        err.issues.forEach(issue => {
          // For nested fields (like recurringPattern.endDate), create a single error under recurringPattern
          const pathKey = issue.path.length > 1 ? issue.path[0] : issue.path[0]
          newErrors[pathKey] = issue.message
        })
        setErrors(newErrors)
      } else {
        toast.error("Something went wrong")
      }
    } finally {
      setIsSubmitting(false)
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

  const weekDays = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
    { value: 2, label: "Tuesday" },
    { value: 3, label: "Wednesday" },
    { value: 4, label: "Thursday" },
    { value: 5, label: "Friday" },
    { value: 6, label: "Saturday" },
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
                  className={`pl-9 ${errors.deadline ? "border-red-500 focus:ring-red-500" : ""}`}
                />
              </div>
              {errors.deadline && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.deadline}
                </p>
              )}
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
                className={errors.estimates ? "border-red-500 focus:ring-red-500" : ""}
              />
              {errors.estimates && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.estimates}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="actualTime">Actual Time (minutes)</Label>
              <Input
                id="actualTime"
                type="number"
                value={formData.actualTime}
                onChange={(e) => handleChange("actualTime", e.target.value)}
                placeholder="0"
                className={errors.actualTime ? "border-red-500 focus:ring-red-500" : ""}
              />
              {errors.actualTime && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.actualTime}
                </p>
              )}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleChange("priority", value)}
            >
              <SelectTrigger id="priority" aria-label="Priority">
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
                  className={`cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    formData.labels.includes(label.id)
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => handleLabelToggle(label.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleLabelToggle(label.id);
                    }
                  }}
                  role="button"
                  aria-label={`Toggle ${label.name} label`}
                  tabIndex={0}
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
            
            {errors.recurringPattern && (
              <p className="text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.recurringPattern}
              </p>
            )}
            
            {formData.isRecurring && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.2 }}
                className="mt-2 space-y-4"
              >
                {/* Pattern Type */}
                <div className="space-y-1.5">
                  <Label>Recurrence Type</Label>
                  <Select
                    value={formData.recurringPattern.type}
                    onValueChange={(value) => handleChange("recurringPattern", {
                      ...formData.recurringPattern,
                      type: value as any,
                    })}
                  >
                    <SelectTrigger aria-label="Recurrence type">
                      <SelectValue placeholder="Select recurrence type" />
                    </SelectTrigger>
                    <SelectContent>
                      {recurringPatterns.map((pattern) => (
                        <SelectItem key={pattern.value} value={pattern.value}>
                          {pattern.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Interval */}
                <div className="space-y-1.5">
                  <Label>Interval</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="1"
                      value={formData.recurringPattern.interval}
                      onChange={(e) => handleChange("recurringPattern", {
                        ...formData.recurringPattern,
                        interval: Math.max(1, parseInt(e.target.value) || 1),
                      })}
                      className="w-20"
                    />
                    <span className="text-muted-foreground">
                      {formData.recurringPattern.interval === 1 
                        ? formData.recurringPattern.type === "weekday" ? "weekday" 
                        : formData.recurringPattern.type 
                        : `${formData.recurringPattern.type}s`}
                    </span>
                  </div>
                </div>

                {/* Days of Week (for weekly and custom patterns) */}
                {(formData.recurringPattern.type === "weekly" || formData.recurringPattern.type === "custom") && (
                  <div className="space-y-1.5">
                    <Label>Days of Week</Label>
                    <div className="flex flex-wrap gap-2">
                      {weekDays.map((day) => (
                        <Badge
                          key={day.value}
                          className={`cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                            formData.recurringPattern.daysOfWeek?.includes(day.value)
                              ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                          onClick={() => {
                            const currentDays = formData.recurringPattern.daysOfWeek || []
                            const newDays = currentDays.includes(day.value)
                              ? currentDays.filter((d: number) => d !== day.value)
                              : [...currentDays, day.value]
                            handleChange("recurringPattern", {
                              ...formData.recurringPattern,
                              daysOfWeek: newDays,
                            })
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              const currentDays = formData.recurringPattern.daysOfWeek || []
                              const newDays = currentDays.includes(day.value)
                                ? currentDays.filter((d: number) => d !== day.value)
                                : [...currentDays, day.value]
                              handleChange("recurringPattern", {
                                ...formData.recurringPattern,
                                daysOfWeek: newDays,
                              })
                            }
                          }}
                          role="button"
                          aria-label={`Toggle ${day.label}`}
                          tabIndex={0}
                        >
                          {day.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Day of Month (for monthly and yearly patterns) */}
                {(formData.recurringPattern.type === "monthly" || formData.recurringPattern.type === "yearly") && (
                  <div className="space-y-1.5">
                    <Label>Day of Month</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.recurringPattern.dayOfMonth || 1}
                      onChange={(e) => handleChange("recurringPattern", {
                        ...formData.recurringPattern,
                        dayOfMonth: Math.max(1, Math.min(31, parseInt(e.target.value) || 1)),
                      })}
                      className="w-20"
                    />
                  </div>
                )}

                {/* Month (for yearly patterns) */}
                {formData.recurringPattern.type === "yearly" && (
                  <div className="space-y-1.5">
                    <Label>Month</Label>
                    <Select
                      value={formData.recurringPattern.month || 1}
                      onValueChange={(value) => handleChange("recurringPattern", {
                        ...formData.recurringPattern,
                        month: parseInt(value),
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select month" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
                          <SelectItem key={month} value={month.toString()}>
                            {new Date(2024, month - 1, 1).toLocaleString('default', { month: 'long' })}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* End Date */}
                <div className="space-y-1.5">
                  <Label>End Date (Optional)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={formData.recurringPattern.endDate || ""}
                      onChange={(e) => handleChange("recurringPattern", {
                        ...formData.recurringPattern,
                        endDate: e.target.value,
                      })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Subtasks */}
          <div className="space-y-1.5">
            <Label>Subtasks</Label>
            <SubtaskList
              subtasks={subtasks}
              onAdd={(name) => setSubtasks(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name, completedAt: null }])}
              onUpdate={(id, name) => setSubtasks(prev => prev.map(subtask => subtask.id === id ? { ...subtask, name } : subtask))}
              onDelete={(id) => setSubtasks(prev => prev.filter(subtask => subtask.id !== id))}
              onToggle={(id, completed) => setSubtasks(prev => prev.map(subtask => subtask.id === id ? { ...subtask, completedAt: completed ? new Date() : null } : subtask))}
            />
          </div>

          {/* Reminders */}
          <div className="space-y-1.5">
            <Label>Reminders</Label>
            <div className="space-y-2">
              {formData.reminders.map((reminder, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="datetime-local"
                      value={reminder}
                      onChange={(e) => {
                        const newReminders = [...formData.reminders];
                        newReminders[index] = e.target.value;
                        handleChange("reminders", newReminders);
                      }}
                      className={`pl-9 ${errors.reminders ? "border-red-500 focus:ring-red-500" : ""}`}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newReminders = formData.reminders.filter((_, i) => i !== index);
                      handleChange("reminders", newReminders);
                    }}
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleChange("reminders", [...formData.reminders, ""]);
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                + Add Reminder
              </Button>
              {errors.reminders && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.reminders}
                </p>
              )}
            </div>
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
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : (task ? "Save Changes" : "Create Task")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
