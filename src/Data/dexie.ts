import Dexie from 'dexie'
// import dexieCloud from 'dexie-cloud-addon'
import { Task } from '../Model/Task'
import { initialActiveTasks, initialCompletedTasks } from '../Model/Tasks'
import { registerSyncProtocol } from './dexie-sync-ajax'

// const db = new Dexie("mydb", {addons: [dexieCloud]});
/*
* adds all tables as refs by name "on" the db instance
* meant to be called after this.version(#).stores
* instead of one by one boilerplate:
* this.CompletedTasks = this.table('CompletedTasks')
*/
const addTableRefs = (dexieInstance: Dexie) => dexieInstance.tables.forEach(table => { dexieInstance[table.name] = table })

class TodoDB extends Dexie {
  // [x: string]: any
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

    // super('TodoDB', { addons: [dexieCloud] })
    // this.cloud.configure({
    //   databaseUrl: 'https://wh.n8n.zt.ax/webhook/dexie-cloud',
    //   requireAuth: false,
    //   // fetchToken?: customTokenFetcher
    // })

    this.version(1).stores({
      ActiveTasks: '[created+user], created, modified, user',
      CompletedTasks: '[created+user], created, modified, user',
      // ...other tables go here...//
    })
    addTableRefs(this)
    this.ActiveTasks.mapToClass(Task) //   https://dexie.org/docs/Typescript#storing-real-classes-instead-of-just-interfaces
    this.CompletedTasks.mapToClass(Task)

    this.syncable.connect(
      'todo_sync_protocol',
      'https://wh.n8n.zt.ax/webhook/dexie-sync',
      // {options...},
    )
      .catch(err => {
        console.error('Failed to connect:', err.stack ?? err)
      })

    void this.init()
  }
}
registerSyncProtocol()
export const todoDB = new TodoDB()
