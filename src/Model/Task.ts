import { completeActiveTask } from '../Data/data'
import { utcTs } from '../Utils/js-utils'
import { addActiveTask } from './../Data/data'
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

  // experimenting with the pattern that an object can be empowered to influence the datamodel
  // mixture of separation of concerns and convenience,
  // as the functions that are actually data layer aware (eg dexieDB) are imported here
  // and offered as viewModel style convenience methods
  public complete () {
    void completeActiveTask(this)
  }

  public commit () {
    if (this.status === TaskStatus.Active) {
      void addActiveTask(this)
    }
  }
}
