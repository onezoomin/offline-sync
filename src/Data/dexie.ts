import { Table } from 'dexie'
import { CompoundKeyNumStr, TaskVM } from '../Model/Task'
import { initialActiveTasks, initialCompletedTasks } from '../Model/Tasks'
import { TaskParams } from './../Model/Task'
import BygonzDexie from './Bygonz/Bygonz'
export class TodoDB extends BygonzDexie {
  // Declare implicit table properties. (just to inform Typescript. Instanciated by Dexie in stores() method)
  // TaskParams | TaskVM allows for partial objects to be used in add and put and for the class to include getters
  ActiveTasks: Table<TaskParams | TaskVM, CompoundKeyNumStr> = this._allTables.ActiveTasks // CompoundKeyNumStr = type of the priKey
  CompletedTasks: Table<TaskParams | TaskVM, CompoundKeyNumStr> = this._allTables.CompletedTasks

  async init () {
    const at = this.ActiveTasks
    if ((await at.count()) === 0) {
      await at.bulkAdd(initialActiveTasks)
    }
    if ((await this.CompletedTasks.count()) === 0) {
      await this.CompletedTasks.bulkAdd(initialCompletedTasks)
    }
  }
}
const stores = {
  ActiveTasks: '[created+owner], created, modified, owner',
  CompletedTasks: '[created+owner], created, modified, owner',
}

const mappings = {
  ActiveTasks: TaskVM,
  CompletedTasks: TaskVM,
}
const options = {
  conflictThresholds: {
    red: 120,
    yellow: 600,
  },
  conflictHandlers: {},
}
export const todoDB = new TodoDB('Todo', stores, mappings, options)
await todoDB.init()
