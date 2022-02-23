import { userAddress } from '../Data/wallet'
import { Task } from './Task'
import { TaskStatus } from './TaskStatus'

const initialActiveTasks: Task[] = [
  new Task({
    owner: userAddress,
    task: 'init task1',
    status: TaskStatus.Active,
  }),
]
const initialCompletedTasks: Task[] = [
  new Task({
    owner: userAddress,
    task: 'finished task1',
    status: TaskStatus.Completed,
  }),
]

export { initialActiveTasks, initialCompletedTasks }
