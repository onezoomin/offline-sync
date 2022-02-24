
import { BYGONZ_MUTATION_EVENT_NAME, checkWorker, utcMsTs } from './WebWorkerImports/Utils'
// checkWorker('top of bygonz worker')

// hack to avoid overlay.ts's dom assumptions
self.HTMLElement = function () {
  return {}
}
self.customElements = {
  get () {
    return []
  },
}

let targetDB
let modDB
self.onmessage = async (e) => {
  if (e.data.cmd === 'init') {
    if (!targetDB) {
      const { dbName, stores } = e.data
      const { default: BygonzDexie } = await import('./Bygonz')

      const uncastDB = new BygonzDexie(dbName, stores)
      if (!(await BygonzDexie.exists(uncastDB.name))) {
        console.log('Db does not exist')
      // db.version(1).stores({});
      }
      await uncastDB.open()

      targetDB = uncastDB as typeof BygonzDexie
      checkWorker('just opened ->', targetDB)
    } else {
      checkWorker('already opened ->', targetDB)
    }
    const { getModDB } = await import('./WebWorkerImports/Mods.ts')
    modDB = await getModDB()
    checkWorker('mod ->', modDB)

    const modTable = modDB.Mods

    const commitMod = (modLogEntry) => {
      // if (hookState.isSuspended) return // console.log('skipping commit')

      void modTable.add(modLogEntry)
      // void dgraphMod(modLogEntry)
    }

    // const { getCreatingHookForTable, getDeletingHookForTable, getUpdateHookForTable } = await import('./WebWorkerImports/Hooks.ts')

    // const getTableHooks = {
    //   updating: getUpdateHookForTable,
    //   creating: getCreatingHookForTable,
    //   deleting: getDeletingHookForTable,
    // }
    // const objThatOnlyLivesHere: Record<string, (tableName: any) => (modifications: any, forKey: any, obj: any) => void> = {}
    // for (const { name: eachTableName } of targetDB.tables) {
    //   for (const eachEvent of Object.keys(getTableHooks)) {
    //     objThatOnlyLivesHere[`${eachTableName}_${eachEvent}}`] = (getTableHooks[eachEvent](eachTableName, commitMod)).bind(self);
    //     (targetDB[eachTableName]).hook(eachEvent, objThatOnlyLivesHere[`${eachTableName}_${eachEvent}}`])
    //   }
    // }
    const addTask = async () => {
      const ts = utcMsTs()
      const task = `${ts} ww create ${(Math.random() * 2000).toFixed(0)}`
      await targetDB?.ActiveTasks?.add({ task, owner: '0xWW', status: 'active', modified: ts, created: ts })
    }
    void addTask()
    setTimeout(addTask, 1500)

    // const { default: { liveQuery } } = await import('dexie')

    // class Signal {
    //   promise = new Promise(resolve => this.resolve = resolve)
    // }

    // const signal = new Signal()
    // const subscription = liveQuery(() => targetDB?.ActiveTasks?.orderBy('modified').toArray()).subscribe(result => {
    //   console.log(result)

    //   signal.resolve(result)
    // })
    // const result = await signal.promise
    // console.log(subscription, result)

    // https://github.com/dexie/Dexie.js/blob/master/src/globals/global-events.ts
    const DEXIE_STORAGE_MUTATED_EVENT_NAME = 'storagemutated' as 'storagemutated'
    const STORAGE_MUTATED_DOM_EVENT_NAME = 'x-storagemutated-1'

    // https://github.com/dexie/Dexie.js/blob/master/src/live-query/enable-broadcast.ts
    const bc = new BroadcastChannel(BYGONZ_MUTATION_EVENT_NAME)

    // targetDB.on('storagemutated', (ev) => {
    //   console.log('storagemutated', ev)
    // })

    bc.onmessage = (ev) => {
      // if (ev.data) propagateLocally(ev.data);
      console.log('bygonz afterEffect', ev, utcMsTs())

      const { data: modEntry } = ev
      commitMod(modEntry)
    }
  } // </init
}
