"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Plus, Trash2, Edit2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
interface Subtask {
  id: string
  name: string
  completedAt: Date | null
}

interface SubtaskListProps {
  subtasks: Subtask[]
  onAdd?: (name: string) => void
  onUpdate?: (id: string, name: string) => void
  onDelete?: (id: string) => void
  onToggle?: (id: string, completed: boolean) => void
}

export function SubtaskList({ 
  subtasks, 
  onAdd, 
  onUpdate, 
  onDelete, 
  onToggle 
}: SubtaskListProps) {
  const [newSubtaskName, setNewSubtaskName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault()
    if (newSubtaskName.trim()) {
      onAdd?.(newSubtaskName.trim())
      setNewSubtaskName("")
    }
  }

  const handleStartEdit = (subtask: Subtask) => {
    setEditingId(subtask.id)
    setEditValue(subtask.name)
  }

  const handleSaveEdit = (id: string) => {
    if (editValue.trim()) {
      onUpdate?.(id, editValue.trim())
    }
    setEditingId(null)
    setEditValue("")
  }

  const handleToggleSubtask = (subtask: Subtask, checked: boolean) => {
    onToggle?.(subtask.id, checked)
  }

  return (
    <div className="space-y-3">
      {/* Subtask List */}
      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <motion.div
            key={subtask.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2"
          >
            <Checkbox
              checked={!!subtask.completedAt}
              onCheckedChange={(checked) => handleToggleSubtask(subtask, !!checked)}
              className="h-4 w-4"
            />
            
            {editingId === subtask.id ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => handleSaveEdit(subtask.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveEdit(subtask.id)
                    if (e.key === "Escape") setEditingId(null)
                  }}
                  autoFocus
                  className="h-7 text-sm"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSaveEdit(subtask.id)}
                  className="h-7 w-7"
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-between">
                <span className={`text-sm ${
                  subtask.completedAt ? "line-through text-muted-foreground" : "text-foreground"
                }`}>
                  {subtask.name}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartEdit(subtask)}
                    className="h-6 w-6 text-blue-600 hover:text-blue-700 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    title="Edit subtask"
                    aria-label={`Edit ${subtask.name}`}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete?.(subtask.id)}
                    className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    title="Delete subtask"
                    aria-label={`Delete ${subtask.name}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Add Subtask Form */}
      <form onSubmit={handleAddSubtask} className="flex gap-2">
        <Input
          type="text"
          placeholder="Add a subtask..."
          value={newSubtaskName}
          onChange={(e) => setNewSubtaskName(e.target.value)}
          className="flex-1 text-sm"
        />
        <Button type="submit" size="sm" disabled={!newSubtaskName.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </form>
    </div>
  )
}
