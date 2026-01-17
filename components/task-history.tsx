"use client"

import { motion } from "framer-motion"
import { 
  Clock, 
  Edit2, 
  CheckCircle2, 
  Trash2, 
  AlertCircle,
  Calendar,
  Clock3
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface TaskHistoryItem {
  id: string
  action: string
  oldValue?: string
  newValue?: string
  changedBy?: string
  createdAt: string
}

interface TaskHistoryProps {
  history: TaskHistoryItem[]
}

export function TaskHistory({ history }: TaskHistoryProps) {
  // Get action icon based on action type
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "created":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "updated":
        return <Edit2 className="h-4 w-4 text-blue-600" />
      case "deleted":
        return <Trash2 className="h-4 w-4 text-red-600" />
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case "uncompleted":
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  // Get action label
  const getActionLabel = (action: string) => {
    return action.charAt(0).toUpperCase() + action.slice(1)
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  // Render change details
  const renderChangeDetails = (item: TaskHistoryItem) => {
    if (item.action.toLowerCase() === "created") {
      return <span>Task created</span>
    }

    if (item.action.toLowerCase() === "completed") {
      return <span>Task marked as complete</span>
    }

    if (item.action.toLowerCase() === "uncompleted") {
      return <span>Task marked as incomplete</span>
    }

    if (item.oldValue !== undefined && item.newValue !== undefined) {
      return (
        <div className="space-y-1 mt-1">
          <div className="text-sm text-muted-foreground line-through">
            {item.oldValue}
          </div>
          <div className="text-sm font-medium">
            {item.newValue}
          </div>
        </div>
      )
    }

    if (item.newValue !== undefined) {
      return (
        <div className="mt-1">
          <div className="text-sm font-medium">
            {item.newValue}
          </div>
        </div>
      )
    }

    if (item.oldValue !== undefined) {
      return (
        <div className="mt-1">
          <div className="text-sm text-muted-foreground line-through">
            {item.oldValue}
          </div>
        </div>
      )
    }

    return null
  }

  if (history.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No history for this task yet</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Task History</h3>
      <div className="space-y-4">
        {history.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex gap-3"
          >
            {/* Timeline dot */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                {getActionIcon(item.action)}
              </div>
              <div className="w-px h-full bg-gray-200 mt-1 -mb-4" />
            </div>

            {/* History content */}
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {getActionLabel(item.action)}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDate(item.createdAt)}
                </span>
                {item.changedBy && (
                  <span className="text-xs text-muted-foreground">
                    by {item.changedBy}
                  </span>
                )}
              </div>

              {renderChangeDetails(item)}
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  )
}
