import { completeActiveTask } from '../Data/data'
import { utcTs } from '../Utils/js-utils'
import { addActiveTask } from './../Data/data'
import { TaskStatus } from './TaskStatus'

interface TimeStamped {
  created?: number
  modified?: number
}

export class TimeStampedBase<OBJ extends Record<string, any> & TimeStamped> {
  created: number
  modified: number

  constructor (taskOptions: OBJ) {
    taskOptions.created = taskOptions.created ?? utcTs()
    taskOptions.modified = taskOptions.modified ?? taskOptions.created

    Object.assign(this, taskOptions)
  }

  [x: string]: any
}

export type TaskID = [number, string]

export interface TaskObj /* extends TimeStamped */ {
  task: string
  status: TaskStatus
  user?: string
}

export class Task extends TimeStampedBase<TaskObj> implements TaskObj {
  task: string
  status: TaskStatus
  user?: string = `0x123${Math.round(Math.random() * 222).toFixed(0)}`

  public get short (): string {
    return `${this.task.slice(0, 20)}...`
  }

  public get id (): TaskID {
    return [this.created, this.user ?? ''] // awkward ts
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
