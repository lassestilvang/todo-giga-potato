import { parseRecurringPattern, getNextOccurrence, isTaskActive, getRecurrenceSummary } from '@/lib/recurring-utils'

describe('parseRecurringPattern', () => {
  it('should parse string patterns', () => {
    const pattern = parseRecurringPattern('daily')
    expect(pattern.type).toBe('daily')
    expect(pattern.interval).toBe(1)
  })

  it('should parse JSON string patterns', () => {
    const pattern = parseRecurringPattern('{"type":"weekly","interval":2,"daysOfWeek":[1,3,5]}')
    expect(pattern.type).toBe('weekly')
    expect(pattern.interval).toBe(2)
    expect(pattern.daysOfWeek).toEqual([1, 3, 5])
  })

  it('should handle invalid JSON', () => {
    const pattern = parseRecurringPattern('invalid json')
    expect(pattern.type).toBe('daily')
    expect(pattern.interval).toBe(1)
  })
})

describe('getNextOccurrence', () => {
  it('should calculate next daily occurrence', () => {
    const task = {
      id: '1',
      name: 'Test Task',
      date: new Date('2024-01-15'),
      isRecurring: true,
      recurringPattern: '{"type":"daily","interval":1}',
    } as any

    const nextDate = getNextOccurrence(task)
    expect(nextDate).not.toBeNull()
    expect(nextDate?.toISOString().split('T')[0]).toBe('2024-01-16')
  })

  it('should calculate next weekly occurrence', () => {
    const task = {
      id: '1',
      name: 'Test Task',
      date: new Date('2024-01-15'), // Monday
      isRecurring: true,
      recurringPattern: '{"type":"weekly","interval":1,"daysOfWeek":[1]}',
    } as any

    const nextDate = getNextOccurrence(task)
    expect(nextDate?.toISOString().split('T')[0]).toBe('2024-01-22')
  })

  it('should calculate next monthly occurrence', () => {
    const task = {
      id: '1',
      name: 'Test Task',
      date: new Date('2024-01-15'),
      isRecurring: true,
      recurringPattern: '{"type":"monthly","interval":1,"dayOfMonth":15}',
    } as any

    const nextDate = getNextOccurrence(task)
    expect(nextDate?.toISOString().split('T')[0]).toBe('2024-02-15')
  })

  it('should return null for tasks without date', () => {
    const task = {
      id: '1',
      name: 'Test Task',
      isRecurring: true,
      recurringPattern: '{"type":"daily"}',
    } as any

    const nextDate = getNextOccurrence(task)
    expect(nextDate).toBeNull()
  })
})

describe('isTaskActive', () => {
  it('should return true for active tasks without end date', () => {
    const task = {
      id: '1',
      name: 'Test Task',
      isRecurring: true,
      recurringPattern: '{"type":"daily"}',
    } as any

    const isActive = isTaskActive(task)
    expect(isActive).toBe(true)
  })

  it('should return true for active tasks within end date', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const task = {
      id: '1',
      name: 'Test Task',
      isRecurring: true,
      recurringPattern: `{"type":"daily","endDate":"${tomorrow.toISOString().split('T')[0]}"}`,
    } as any

    const isActive = isTaskActive(task)
    expect(isActive).toBe(true)
  })

  it('should return false for inactive tasks beyond end date', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const task = {
      id: '1',
      name: 'Test Task',
      isRecurring: true,
      recurringPattern: `{"type":"daily","endDate":"${yesterday.toISOString().split('T')[0]}"}`,
    } as any

    const isActive = isTaskActive(task)
    expect(isActive).toBe(false)
  })
})

describe('getRecurrenceSummary', () => {
  it('should generate daily summary', () => {
    const summary = getRecurrenceSummary({ type: 'daily', interval: 1 })
    expect(summary).toBe('Daily')
  })

  it('should generate weekly summary', () => {
    const summary = getRecurrenceSummary({ 
      type: 'weekly', 
      interval: 1, 
      daysOfWeek: [1, 3, 5] 
    })
    expect(summary).toBe('Every week on Mon, Wed, Fri')
  })

  it('should generate monthly summary', () => {
    const summary = getRecurrenceSummary({ 
      type: 'monthly', 
      interval: 2, 
      dayOfMonth: 15 
    })
    expect(summary).toBe('Every 2 months')
  })

  it('should generate yearly summary', () => {
    const summary = getRecurrenceSummary({ 
      type: 'yearly', 
      interval: 1, 
      month: 12, 
      dayOfMonth: 25 
    })
    expect(summary).toBe('Every year on Dec 25')
  })
})
