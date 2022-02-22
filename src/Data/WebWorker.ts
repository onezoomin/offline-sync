import Dexie, { DBCore, Middleware } from 'dexie'
import { CompoundKeyNumStr, TaskVM } from '../Model/Task'
import { initialActiveTasks, initialCompletedTasks } from '../Model/Tasks'
import { TaskParams } from './../Model/Task'
import { utcMsTs } from './bygonz'
import { getCreatingHookForTable, getDeletingHookForTable, getUpdateHookForTable, opLogRollup } from './dexie-sync-hooks'
// import { initPoll } from './dgraph-socket'
// import { registerSyncProtocol } from './dexie-sync-ajax'

export const checkWorker = (...msg) => {
  // run this in global scope of window or worker. since window.self = window, we're ok
  if (self.document === undefined && !(self instanceof Window)) {
    console.log('huzzah! a worker!', ...msg)
  } else {
    console.log(self?.DedicatedWorkerGlobalScope, self?.WorkerGlobalScope, self.document, ' sad trombone. not worker ', ...msg)
  }
}

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
            // console.log('dbcore mut in ww', myRequest)
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
const addTableRefs = (dexieInstance: Dexie) => dexieInstance.tables.forEach(table => {
  dexieInstance[table.name] = table
})

export class TodoDB extends Dexie {
  // Declare implicit table properties. (just to inform Typescript. Instanciated by Dexie in stores() method)
  // TaskParams | TaskVM allows for partial objects to be used in add and put and for the class to include getters
  ActiveTasks: Dexie.Table<TaskParams | TaskVM, CompoundKeyNumStr> // TaskID = type of the priKey
  CompletedTasks: Dexie.Table<TaskParams | TaskVM, CompoundKeyNumStr>
  // ...other tables go here...

  static singletonInstance: TodoDB

  async init () {
    this.use(bygonzConfig)

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
    addTableRefs(this)
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
export const todoDB = await TodoDB.getInitializedInstance()

const getTableHooks = {
  updating: getUpdateHookForTable,
  creating: getCreatingHookForTable,
  deleting: getDeletingHookForTable,
}
const objThatOnlyLivesHere = []
for (const { name: eachTableName } of todoDB.tables) {
  for (const eachEvent of ['updating', 'creating', 'deleting']) {
    objThatOnlyLivesHere[`${eachTableName}_${eachEvent}}`] = getTableHooks[eachEvent](eachTableName)
    todoDB[eachTableName].hook(eachEvent, objThatOnlyLivesHere[`${eachTableName}_${eachEvent}}`])
  }
  // todoDB[eachTableName].hook('creating', getCreatingHookForTable(eachTableName))
  // todoDB[eachTableName].hook('deleting', getDeletingHookForTable(eachTableName))
}

export let rollupInterval
// export let todoDB: TodoDB
// const checkWorker = (...msg) => {
//   // run this in global scope of window or worker. since window.self = window, we're ok
//   if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
//     console.log('huzzah! a worker!', ...msg)
//   } else {
//     console.log(' sad trombone. not worker ', ...msg)
//   }
// }

export const getDB = async () => {
  checkWorker('getDB')
  // registerSyncProtocol()
  // todoDB = await TodoDB.getInitializedInstance()
  const at = todoDB.ActiveTasks
  const tasks = await at.toArray() as TaskVM[]
  // console.log('inww tasks', tasks)
  if (tasks.length === 1) {
    await at.put({ ...tasks[0], task: 'edited by ww' }) // put as edit
    await at.put({ ...tasks[0], created: utcMsTs(), task: 'added from ww' }) // put as add
    const tasksa = await at.toArray()
    console.log('inww after', tasksa)
  }

  // const mostRecentMod = Math.max(...(tasks.map((o) => { return o.modified })))
  // const onTaskPoll = (tasksResult) => {
  //   console.log('ww poll result', tasksResult)
  // }
  // initPoll(onTaskPoll)
  void opLogRollup(true, true)
  rollupInterval = setInterval(() => {
    void opLogRollup()
  }, 10000)
  // initSub()
  return todoDB
}
checkWorker('top of worker')
void getDB()
