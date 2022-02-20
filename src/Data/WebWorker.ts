import Dexie, { DBCore, Middleware } from 'dexie'
import { CompoundKeyNumStr, TaskVM } from '../Model/Task'
import { initialActiveTasks, initialCompletedTasks } from '../Model/Tasks'
import { utcTs } from '../Utils/js-utils'
import { TaskParams } from './../Model/Task'
import { getCreatingHookForTable, getDeletingHookForTable, getUpdateHookForTable } from './dexie-sync-hooks'
// import { registerSyncProtocol } from './dexie-sync-ajax'
import { mode, msg } from './workerImport'

export let todoDB // export

const bygonzConfig: Middleware<DBCore> = {
  stack: 'dbcore', // The only stack supported so far.
  name: 'bygonz', // Optional name of your middleware
  create (downlevelDatabase) {
    // console.log('ww create in use.create', downlevelDatabase)
    // Return your own implementation of DBCore:
    return {
      // Copy default implementation.
      ...downlevelDatabase,
      // Override table method
      table (tableName) {
        // Call default table method
        const downlevelTable = downlevelDatabase.table(tableName)
        // Derive your own table from it:
        return {
          // Copy default table implementation:
          ...downlevelTable,
          // Override the mutate method:
          mutate: req => {
            // Copy the request object
            const myRequest = { ...req }
            // Do things before mutate, then
            console.log('dbcore mut in ww', myRequest)
            // call downlevel mutate:
            return downlevelTable.mutate(myRequest).then(res => {
              // Do things after mutate
              const myResponse = { ...res }
              // Then return your response:
              return myResponse
            })
          },
        }
      },
    }
  },
}

/*
* adds all tables as refs by name "on" the db instance
* meant to be called after this.version(#).stores
* instead of one by one boilerplate:
* this.CompletedTasks = this.table('CompletedTasks')
*/
// const addTableRefs = (dexieInstance: Dexie) => dexieInstance.tables.forEach(table => {
//   dexieInstance[table.name] = table
// })

export class TodoDB extends Dexie {
  // Declare implicit table properties. (just to inform Typescript. Instanciated by Dexie in stores() method)
  // TaskParams | TaskVM allows for partial objects to be used in add and put and for the class to include getters
  ActiveTasks: Dexie.Table<TaskParams | TaskVM, CompoundKeyNumStr> // TaskID = type of the priKey
  CompletedTasks: Dexie.Table<TaskParams | TaskVM, CompoundKeyNumStr>
  // ...other tables go here...

  static singletonInstance: TodoDB

  async init () {
    this.use(bygonzConfig)

    for (const { name: eachTableName } of this.tables) {
      this[eachTableName].hook('updating', getUpdateHookForTable(eachTableName))
      this[eachTableName].hook('creating', getCreatingHookForTable(eachTableName))
      this[eachTableName].hook('deleting', getDeletingHookForTable(eachTableName))
    }

    const at = this.ActiveTasks
    if ((await at.count()) === 0) {
      await at.bulkAdd(initialActiveTasks)
    }
    if ((await this.CompletedTasks.count()) === 0) {
      await this.CompletedTasks.bulkAdd(initialCompletedTasks)
    }
  }

  static async getInitializedInstance () {
    if (!this.singletonInstance) {
      this.singletonInstance = new TodoDB()
      await this.singletonInstance.init()
    }
    return this.singletonInstance
  }

  constructor () {
    super('TodoDB')

    // super('TodoDB', { addons: [dexieCloud] })
    // this.cloud.configure({
    //   databaseUrl: 'https://wh.n8n.zt.ax/webhook/dexie-cloud',
    //   requireAuth: false,
    //   // fetchToken?: customTokenFetcher
    // })

    this.version(1).stores({
      ActiveTasks: '[created+owner], created, modified, owner',
      CompletedTasks: '[created+owner], created, modified, owner',
      // ...other tables go here...//
    })
    // addTableRefs(this)
    this.ActiveTasks.mapToClass(TaskVM) //   https://dexie.org/docs/Typescript#storing-real-classes-instead-of-just-interfaces
    this.CompletedTasks.mapToClass(TaskVM)

    // this.syncable.connect(
    //   'todo_sync_protocol',
    //   'https://wh.n8n.zt.ax/webhook/dexie-sync',
    //   // {options...},
    // ).catch(err => {
    //   console.error('Failed to connect:', err.stack ?? err)
    // })
    // this.syncable.disconnect('https://wh.n8n.zt.ax/webhook/dexie-sync')
  }
}

async function getDB () {
  // registerSyncProtocol()
  todoDB = await TodoDB.getInitializedInstance()
  const at = todoDB.ActiveTasks
  const tasks = await at.toArray()
  console.log('inww tasks', tasks)
  if (tasks.length === 1) {
    await at.put({ ...tasks[0], task: 'edited by ww' }) // put as edit
    await at.put({ ...tasks[0], created: utcTs(), task: 'added from ww' }) // put as add
    const tasksa = await at.toArray()
    console.log('inww after', tasksa)
  }
}

void getDB()

let counter = 0
self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage({ msg: `${msg} - ${counter++}`, mode })
  } else if (e.data === 'clear') {
    counter = 1
    self.postMessage({ msg: null, mode: null })
  }
}
