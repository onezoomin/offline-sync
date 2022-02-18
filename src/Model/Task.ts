import { utcTs } from '../Utils/js-utils'
import { TaskStatus } from './TaskStatus'

export class TimeStamped {
  created?: number
  modified?: number

  constructor (taskOptions: TaskObj) {
    taskOptions.created = taskOptions.created ?? utcTs()
    taskOptions.modified = taskOptions.modified ?? taskOptions.created

    Object.assign(this, taskOptions)
  }
}
export class TaskObj extends TimeStamped {
  task: string
  status: TaskStatus
  user?: string = '0x123'

  constructor (taskOptions: TaskObj) {
    super(taskOptions)
    Object.assign(this, taskOptions)
  }
}
export class Task extends TaskObj {
  public get short (): string {
    return `${this.task.slice(0, 20)}...`
  }

  public get id (): [number, string] {
    return [this.created ?? 0, this.user ?? ''] // awkward ts
  }
}
