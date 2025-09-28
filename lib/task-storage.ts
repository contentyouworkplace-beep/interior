// Shared in-memory storage for task completion states and custom tasks
// This will be replaced with actual database storage once the tasks table is created

interface Task {
  id: string
  title: string
  time: string
  type: string
  date: string
  completed: boolean
}

export let taskCompletionStates: { [key: string]: boolean } = {}
export let customTasks: Record<string, Task[]> = {}

export function setTaskCompletion(taskId: string, completed: boolean) {
  taskCompletionStates[taskId] = completed
}

export function getTaskCompletion(taskId: string): boolean {
  return taskCompletionStates[taskId] || false
}

export function getAllCompletionStates(): { [key: string]: boolean } {
  return taskCompletionStates
}

export function addCustomTask(task: Omit<Task, 'id'>): string {
  const taskId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  // Format time from 24hr to 12hr if needed
  let formattedTime = task.time
  if (task.time.includes(':') && !task.time.includes('AM') && !task.time.includes('PM')) {
    const [hours, minutes] = task.time.split(':')
    const hour24 = parseInt(hours)
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    formattedTime = `${hour12}:${minutes} ${ampm}`
  }
  
  const newTask: Task = {
    ...task,
    id: taskId,
    time: formattedTime,
    completed: false
  }
  
  if (!customTasks[task.date]) {
    customTasks[task.date] = []
  }
  
  customTasks[task.date].push(newTask)
  return taskId
}

export function getCustomTasks(date: string): Task[] {
  return customTasks[date] || []
}