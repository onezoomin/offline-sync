import { Task } from './Task'
import { TaskStatus } from './TaskStatus'

export const initialActiveTasks: Task[] = [
  new Task({
    task: 'init task1',
    status: TaskStatus.Active,
  }),
  new Task({
    task: 'init task2',
    status: TaskStatus.Active,
  }),
]
export const initialCompletedTasks: Task[] = [
  new Task({
    task: 'finished task1',
    status: TaskStatus.Completed,
  }),
]
