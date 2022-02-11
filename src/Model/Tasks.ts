import { Task } from './Task'
import { TaskStatus } from './TaskStatus'
export interface Tasks {
  id: string
  tasks: Task[]
}

export const initialActiveTasks: Task[] = [
  {
    task: 'init task1',
    status: TaskStatus.Active,
  }, {
    task: 'init task2',
    status: TaskStatus.Active,
  },
]
export const initialCompletedTasks: Task[] = [
  {
    task: 'finished task1',
    status: TaskStatus.Completed,
  },
]
