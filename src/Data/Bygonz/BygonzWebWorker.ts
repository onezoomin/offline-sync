
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
      const { dbName, stores, options } = e.data
      const { default: BygonzDexie } = await import('./Bygonz')

      if (!(await BygonzDexie.exists(`${dbName}_BygonzDexie`))) {
        console.log('Db does not exist')
      // db.version(1).stores({});
      }
      const unmappedDB = new BygonzDexie(dbName, stores, options)
      // await unmappedDB.open()

      targetDB = unmappedDB
      checkWorker('just opened ->', targetDB)
    } else {
      checkWorker('already opened ->', targetDB)
    }
    if (!modDB) {
      const { getModDB } = await import('./WebWorkerImports/Mods')
      modDB = await getModDB()
      checkWorker('just opened ->', modDB)
    } else {
      checkWorker('already opened ->', modDB)
    }

    const { dgraphMod, fetchAndApplyMods } = await import('./WebWorkerImports/dgraph-socket')
    const modTable = modDB.Mods

    const commitMod = async (modLogEntry) => {
      await modTable.put(modLogEntry)
      await dgraphMod(modLogEntry)
      void fetchAndApplyMods(modDB, targetDB)
    }

    void fetchAndApplyMods(modDB, targetDB, true)

    // mock data from here doesn't make sense as it will not use the middleware to create mods
    // const addTask = async () => {
    //   const ts = utcMsTs()
    //   const task = `${ts} ww create ${(Math.random() * 2000).toFixed(0)}`
    //   await targetDB?.ActiveTasks?.add({ task, owner: '0xWW', status: 'active', modified: ts, created: ts })
    // }
    // void addTask()
    // setTimeout(() => { void addTask() }, 1500)

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
      checkWorker('bygonz afterEffect', ev, utcMsTs())

      const { data: modEntry } = ev
      void commitMod(modEntry)
    }
  } // </init
}
