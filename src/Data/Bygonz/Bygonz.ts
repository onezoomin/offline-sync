import { Dexie } from 'dexie'
import { getBygonzMiddlwareFor } from './BygonzMiddleware'

// import BygonzWorker from './BygonzWebWorker?worker&inline'
// const { default: BygonzWorker } = await import('./BygonzWebWorker?worker')

export default class BygonzDexie extends Dexie {
  public workerApi
  public stores
  public mappings

  public onWorkerMsg = console.log
  private async spawnWorker () {
    console.log('spawning')

    if (self.document === undefined) { console.log('avoiding infinite loop') }

    const { default: BygonzWorker } = await import('./BygonzWebWorker?worker&inline')
    this.workerApi = new BygonzWorker()
    this.workerApi.onmessage = this.onWorkerMsg
    this.workerApi.postMessage({ cmd: 'init', dbName: this.name.replace('_BygonzDexie', ''), stores: this.stores }) // init
  }

  private doMappings () {
    for (const eachTable of this.tables) {
      this[eachTable.name] = eachTable
      if (this.mappings[eachTable.name]) {
        // console.log(this[eachTable.name], 'mapping', eachTable, 'to', mappings[eachTable.name])
        eachTable.mapToClass(this.mappings[eachTable.name])
      }
    }
  }

  constructor (name: string, stores: Record<string, string>, mappings: Record<string, any> = {}, version = 1) {
    if (!name || !stores) throw new Error('BygonzDexie requires params (name, {stores})')
    super(`${name}_BygonzDexie`)

    this.version(version).stores(stores)

    this.stores = stores
    this.mappings = mappings
    this.doMappings()

    if (self.document !== undefined) {
      console.log('ui side, setting up middleware and spawning worker')
      this.use(getBygonzMiddlwareFor(this))
      void this.spawnWorker()
    }
  }
}

const notes = `

https://github.com/dexie/Dexie.js/blob/master/src/live-query/observability-middleware.ts
https://github.com/dexie/Dexie.js/blame/master/src/hooks/hooks-middleware.ts
https://github.com/dexie/Dexie.js/blob/master/src/live-query/live-query.ts

https://github.com/dexie/Dexie.js/blob/master/src/live-query/enable-broadcast.ts

`
