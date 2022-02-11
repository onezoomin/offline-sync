import Dexie from 'dexie'
import { Task } from '../Model/Task'
import { initialActiveTasks, initialCompletedTasks } from '../Model/Tasks'

/*
* adds all tables as refs by name "on" the db instance
* meant to be called after this.version(#).stores
* instead of one by one boilerplate:
* this.CompletedTasks = this.table('CompletedTasks')
*/
const addTableRefs = (dexieInstance: Dexie) => dexieInstance.tables.forEach(table => { dexieInstance[table.name] = table })

class TodoDB extends Dexie {
  // Declare implicit table properties. (just to inform Typescript. Instanciated by Dexie in stores() method)
  ActiveTasks: Dexie.Table<Task, number> // number = type of the primkey
  CompletedTasks: Dexie.Table<Task, number>
  // ...other tables go here...

  async init () {
    if ((await this.ActiveTasks.count()) === 0) {
      await this.ActiveTasks.bulkAdd(initialActiveTasks)
    }
    if ((await this.CompletedTasks.count()) === 0) {
      await this.CompletedTasks.bulkAdd(initialCompletedTasks)
    }
    console.log(this)
  }

  constructor () {
    super('TodoDB')
    this.version(1).stores({
      ActiveTasks: '++id, task, status',
      CompletedTasks: '++id, task, status',
      // ...other tables go here...//
    })
    addTableRefs(this)
    this.ActiveTasks.mapToClass(Task) //   https://dexie.org/docs/Typescript#storing-real-classes-instead-of-just-interfaces
    this.CompletedTasks.mapToClass(Task)
    void this.init()
  }
}
export const todoDB = new TodoDB()
