import { completeActiveTask } from '../Data/data'
import { utcTs } from '../Utils/js-utils'
import { addActiveTask } from './../Data/data'
import { TaskStatus } from './TaskStatus'

export type TaskID = [number, string]
export interface TaskObj {
  created?: number
  modified?: number
  task: string
  status: TaskStatus
  user?: string
}

export class TimeStampedBase {
  created: number
  modified: number

  constructor (obj: any) { // Record<string, any>
    obj.created = obj.created ?? utcTs()
    obj.modified = obj.modified ?? obj.created

    Object.assign(this, obj)
  }
}

export class Task extends TimeStampedBase {
  task: string
  status: TaskStatus
  user?: string = `0x123${Math.round(Math.random() * 222).toFixed(0)}`

  constructor (obj: TaskObj) { // Record<string, any>
    super(obj)
    Object.assign(this, obj)
  }

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
