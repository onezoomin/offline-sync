import { ModWho, TimeStampedBase } from '../Data/Bygonz/WebWorkerImports/Mods'
import { TaskStatus } from './TaskStatus'

export type CompoundKeyNumStr = [number, string]

// TaskParams can be used for a js obj that will be cast to Task or TaskVM
export interface TaskParams {
  created?: number
  owner?: string
  modifier?: string

  modified?: number
  task: string
  status: TaskStatus
}

export class Task extends TimeStampedBase implements ModWho {
  task: string
  status: TaskStatus = TaskStatus.Active
  owner: string
  modifier: string

  constructor (obj: TaskParams) {
    super(obj)
    Object.assign(this, obj)
  }
}
export class TaskVM extends Task {
  public get short (): string {
    return `${this.task.slice(0, 20)}...`
  }

  static getCompoundKey (obj: Task): CompoundKeyNumStr {
    return [obj.created, obj.owner ?? ''] // awkward ts
  }

  public get id (): CompoundKeyNumStr {
    return TaskVM.getCompoundKey(this)
  }

  // public async getModArray (): Promise<Array<ModVM | ModObj>> {
  //   return await ModificationsQuery(this.id)
  // }

  // experimenting with the pattern that an object can be empowered to influence the datamodel
  // mixture of separation of concerns and convenience,
  // as the functions that are actually data layer aware (eg dexieDB) are imported here
  // and offered as viewModel style convenience methods
  // public complete () {
  //   void completeActiveTask(this)
  // }

  // public commit () {
  //   if (this.status === TaskStatus.Active) {
  //     void addActiveTask(this)
  //   }
  // }
}
