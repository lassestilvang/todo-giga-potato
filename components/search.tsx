"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Search, X, Calendar, Folder, Tag, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Types for search results
interface Label {
  id: string
  name: string
  color: string
}

interface List {
  id: string
  name: string
  color: string
}

interface SearchResult {
  id: string
  name: string
  description: string | null
  completedAt: Date | null
  dueDate: Date | null
  priority: number
  list: List
  labels: Label[]
  score: number
}

// Debounce helper function
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// Highlight search matches in text
const HighlightedText: React.FC<{ text: string; searchQuery: string }> = ({ text, searchQuery }) => {
  if (!searchQuery.trim()) return <>{text}</>

  const lowerText = text.toLowerCase()
  const lowerQuery = searchQuery.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)

  if (index === -1) return <>{text}</>

  return (
    <>
      {text.slice(0, index)}
      <span className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded font-medium">
        {text.slice(index, index + searchQuery.length)}
      </span>
      {HighlightedText({
        text: text.slice(index + searchQuery.length),
        searchQuery,
      })}
    </>
  )
}

// Search component
export function SearchComponent() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounced search function
  const debouncedSearch = useEffect(() => {
    const search = debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([])
        setShowResults(false)
        setIsSearching(false)
        return
      }

      setIsSearching(true)

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`)
        const data = await response.json()
        setSearchResults(data.data || [])
        setShowResults(true)
      } catch (error) {
        console.error('Error searching tasks:', error)
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300)

    search(searchQuery)

    return () => {
      // Cleanup timeout if component unmounts
    }
  }, [searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    if (value) {
      setShowResults(true)
    }
  }

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowResults(false)
  }

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    console.log('Selected task:', result)
    setShowResults(false)
    setSearchQuery('')
    // TODO: Navigate to task details or focus on task
  }

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Search</span>
        </div>
        <Input
          type="search"
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => searchQuery && setShowResults(true)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-9 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:w-32 lg:w-64"
        />
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 z-50 mt-2 w-full lg:w-96"
          >
            <Card className="overflow-hidden shadow-lg border">
              <div className="p-2 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="ml-2">Searching...</span>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>No tasks found for &quot;{searchQuery}&quot;</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {searchResults.map((result) => (
                      <motion.button
                        key={result.id}
                        onClick={() => handleSelectResult(result)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                      >
                        {/* Task Name */}
                        <div className="font-medium mb-1">
                          <HighlightedText text={result.name} searchQuery={searchQuery} />
                        </div>

                        {/* Task Description (if exists) */}
                        {result.description && (
                          <div className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            <HighlightedText text={result.description} searchQuery={searchQuery} />
                          </div>
                        )}

                        {/* Task Metadata */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          {/* List */}
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Folder className="h-3 w-3" />
                            <span>{result.list.name}</span>
                          </div>

                          {/* Due Date */}
                          {result.dueDate && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(result.dueDate).toLocaleDateString()}</span>
                            </div>
                          )}

                          {/* Priority */}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <Badge
                              variant={
                                result.priority === 3
                                  ? 'destructive'
                                  : result.priority === 2
                                  ? 'default'
                                  : 'secondary'
                              }
                              className="text-xs px-1 py-0"
                            >
                              {['Low', 'Medium', 'High'][result.priority - 1]}
                            </Badge>
                          </div>

                          {/* Labels */}
                          {result.labels.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              <div className="flex gap-1">
                                {result.labels.map((label) => (
                                  <Badge key={label.id} variant="outline" className="text-xs px-1 py-0">
                                    {label.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
