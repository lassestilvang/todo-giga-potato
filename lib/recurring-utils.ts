import { Task } from '@prisma/client'

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'weekday' | 'monthly' | 'yearly' | 'custom'
  interval: number
  daysOfWeek?: number[]
  dayOfMonth?: number
  month?: number
  endDate?: string
}

// Parse a recurring pattern from string (JSON or legacy format)
export function parseRecurringPattern(pattern: string | RecurringPattern): RecurringPattern {
  if (typeof pattern === 'object') {
    return validateRecurringPattern(pattern)
  }
  
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(pattern)
    return validateRecurringPattern(parsed)
  } catch (e) {
    // Fallback to legacy string format
    return validateRecurringPattern({
      type: pattern as any,
      interval: 1,
    })
  }
}

// Validate recurring pattern and ensure required fields are present
export function validateRecurringPattern(pattern: any): RecurringPattern {
  const validTypes = ['daily', 'weekly', 'weekday', 'monthly', 'yearly', 'custom']
  const type = validTypes.includes(pattern.type) ? pattern.type : 'daily'
  const interval = Math.max(1, pattern.interval || 1)
  
  const validatedPattern: RecurringPattern = {
    type,
    interval,
  }
  
  // Validate days of week (0-6, where 0 is Sunday)
  if (pattern.daysOfWeek) {
    const validDays = pattern.daysOfWeek
      .filter((d: number) => Number.isInteger(d) && d >= 0 && d <= 6)
      .sort((a: number, b: number) => a - b)
    
    if (validDays.length > 0) {
      validatedPattern.daysOfWeek = validDays
    }
  }
  
  // Validate day of month (1-31)
  if (pattern.dayOfMonth) {
    const day = Math.max(1, Math.min(31, pattern.dayOfMonth))
    validatedPattern.dayOfMonth = day
  }
  
  // Validate month (1-12)
  if (pattern.month) {
    const month = Math.max(1, Math.min(12, pattern.month))
    validatedPattern.month = month
  }
  
  // Validate end date
  if (pattern.endDate) {
    const date = new Date(pattern.endDate)
    if (!isNaN(date.getTime())) {
      validatedPattern.endDate = pattern.endDate
    }
  }
  
  return validatedPattern
}

// Generate next occurrence date for a recurring task
export function getNextOccurrence(task: Task): Date | null {
  if (!task.isRecurring || !task.date) {
    return null
  }
  
  try {
    const pattern = parseRecurringPattern(task.recurringPattern || '')
    const lastDate = new Date(task.date)
    let nextDate = new Date(lastDate)
    
    // Calculate next date based on recurrence pattern
    switch (pattern.type) {
      case 'daily':
        nextDate.setDate(lastDate.getDate() + pattern.interval)
        break
        
      case 'weekly':
        nextDate.setDate(lastDate.getDate() + pattern.interval * 7)
        // Adjust to specific days if specified
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          const targetDay = findNextDayOfWeek(nextDate, pattern.daysOfWeek)
          if (targetDay) {
            nextDate = targetDay
          }
        }
        break
        
      case 'weekday':
        nextDate.setDate(lastDate.getDate() + pattern.interval)
        // Skip weekends
        while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
          nextDate.setDate(nextDate.getDate() + 1)
        }
        break
        
      case 'monthly':
        nextDate.setMonth(lastDate.getMonth() + pattern.interval)
        if (pattern.dayOfMonth) {
          nextDate.setDate(pattern.dayOfMonth)
        }
        break
        
      case 'yearly':
        nextDate.setFullYear(lastDate.getFullYear() + pattern.interval)
        if (pattern.month) {
          nextDate.setMonth(pattern.month - 1) // JavaScript months are 0-based
        }
        if (pattern.dayOfMonth) {
          nextDate.setDate(pattern.dayOfMonth)
        }
        break
        
      case 'custom':
        return getCustomNextOccurrence(lastDate, pattern)
        
      default:
        return null
    }
    
    // Check if next date is beyond end date
    if (pattern.endDate && nextDate > new Date(pattern.endDate)) {
      return null
    }
    
    return nextDate
  } catch (error) {
    console.error('Error calculating next occurrence:', error)
    return null
  }
}

// Helper to find next date that matches any of the specified days of week
function findNextDayOfWeek(baseDate: Date, targetDays: number[]): Date | null {
  const currentDay = baseDate.getDay()
  
  // Find the next day in the list
  for (let i = 0; i < 7; i++) {
    const nextDay = (currentDay + i) % 7
    if (targetDays.includes(nextDay)) {
      const result = new Date(baseDate)
      result.setDate(baseDate.getDate() + i)
      return result
    }
  }
  
  return null
}

// Calculate next occurrence for custom patterns
function getCustomNextOccurrence(lastDate: Date, pattern: RecurringPattern): Date | null {
  let nextDate = new Date(lastDate)
  
  // If we have specific days of week
  if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
    nextDate.setDate(nextDate.getDate() + 1)
    const targetDay = findNextDayOfWeek(nextDate, pattern.daysOfWeek)
    if (targetDay) {
      nextDate = targetDay
    }
  } 
  // If we have specific day of month
  else if (pattern.dayOfMonth) {
    nextDate.setMonth(nextDate.getMonth() + 1)
    nextDate.setDate(pattern.dayOfMonth)
  } 
  // Default to daily if no specific pattern
  else {
    nextDate.setDate(nextDate.getDate() + 1)
  }
  
  return nextDate
}

// Check if a task is currently active based on recurrence pattern
export function isTaskActive(task: Task): boolean {
  if (!task.isRecurring) {
    return true
  }
  
  if (!task.recurringPattern) {
    return true
  }
  
  try {
    const pattern = parseRecurringPattern(task.recurringPattern)
    if (!pattern.endDate) {
      return true
    }
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDate = new Date(pattern.endDate)
    endDate.setHours(0, 0, 0, 0)
    
    return today <= endDate
  } catch (error) {
    console.error('Error checking if task is active:', error)
    return true
  }
}

// Generate recurrence summary string for display
export function getRecurrenceSummary(pattern: RecurringPattern): string {
  switch (pattern.type) {
    case 'daily':
      return pattern.interval === 1 ? 'Daily' : `Every ${pattern.interval} days`
      
    case 'weekly':
      if (pattern.interval === 1 && pattern.daysOfWeek) {
        if (pattern.daysOfWeek.length === 7) {
          return 'Daily'
        }
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        return `Every week on ${pattern.daysOfWeek.map(d => dayNames[d]).join(', ')}`
      }
      return `Every ${pattern.interval} weeks`
      
    case 'weekday':
      return pattern.interval === 1 ? 'Every weekday' : `Every ${pattern.interval} weekdays`
      
    case 'monthly':
      if (pattern.interval === 1 && pattern.dayOfMonth) {
        return `Every month on day ${pattern.dayOfMonth}`
      }
      return `Every ${pattern.interval} months`
      
    case 'yearly':
      if (pattern.interval === 1 && pattern.month && pattern.dayOfMonth) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return `Every year on ${monthNames[pattern.month - 1]} ${pattern.dayOfMonth}`
      }
      return `Every ${pattern.interval} years`
      
    case 'custom':
      const parts: string[] = []
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        parts.push(`on ${pattern.daysOfWeek.map(d => dayNames[d]).join(', ')}`)
      }
      if (pattern.dayOfMonth) {
        parts.push(`on day ${pattern.dayOfMonth}`)
      }
      if (pattern.month) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        parts.push(`in ${monthNames[pattern.month - 1]}`)
      }
      
      const interval = pattern.interval > 1 ? `every ${pattern.interval} ` : ''
      return `Custom ${interval}${parts.length > 0 ? parts.join(' ') : ''}`.trim()
      
    default:
      return 'Recurring'
  }
}
