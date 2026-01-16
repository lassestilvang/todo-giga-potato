"use client"

import { useState } from "react"
import { MainContent } from "@/components/main-content"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"

type ViewType = "today" | "next7days" | "upcoming" | "all"

export default function Home() {
  const [activeView, setActiveView] = useState<ViewType>("today")
  const [activeListId, setActiveListId] = useState<string | null>(null)
  const [activeLabelId, setActiveLabelId] = useState<string | null>(null)

  const handleAddTask = () => {
    console.log("Add task")
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        activeView={activeView}
        activeListId={activeListId}
        activeLabelId={activeLabelId}
        onViewChange={setActiveView}
        onListChange={setActiveListId}
        onLabelChange={setActiveLabelId}
        onAddTask={handleAddTask}
      />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <MainContent />
      </div>
    </div>
  )
}