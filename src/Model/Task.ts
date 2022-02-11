import { TaskStatus } from './TaskStatus'
export class TaskOpts {
  task: string
  status: TaskStatus
  id?: number
  constructor (taskOptions: TaskOpts) {
    Object.assign(this, taskOptions)
  }
}
export class Task extends TaskOpts {
  public get short (): string {
    return `${this.task.slice(0, 20)}...`
  }
}
