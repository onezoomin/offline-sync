import { Task } from './Task'
import { TaskStatus } from './TaskStatus'

const initialActiveTasks: Task[] = [
  new Task({
    task: 'init task1',
    status: TaskStatus.Active,
  }),
]
const initialCompletedTasks: Task[] = [
  new Task({
    task: 'finished task1',
    status: TaskStatus.Completed,
  }),
]

export { initialActiveTasks, initialCompletedTasks }
