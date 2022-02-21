import Dexie from 'dexie'
import { EpochClass, EpochObj } from '../Model/Epoch'
import { ModCompoundKey, ModObj, modStoresDef, ModVM } from '../Model/Mod'

const appStartTimeStamp = Date.now()
const p = performance.now()
let precision = 0
// milliseconds since epoch (100nanosecond "precision")
export function utcMsTs (): number {
  const now = new Date()
  const newPrecision = Math.round(performance.now() - p)
  precision = newPrecision === precision ? newPrecision + 1 : newPrecision // ensure 1ms difference - basically
  return appStartTimeStamp + precision + (now.getTimezoneOffset() * 60 * 1000)
}

export class BygonzDB extends Dexie {
  Mods: Dexie.Table<ModVM | ModObj, ModCompoundKey>

  static singletonInstance: BygonzDB

  async init () {
    console.log('init', this)
  }

  static async getInitializedInstance () {
    if (!this.singletonInstance) {
      this.singletonInstance = new BygonzDB()
      await this.singletonInstance.init()
    }
    return this.singletonInstance
  }

  constructor () {
    super('Bygonz_ModDB')
    this.version(1).stores(modStoresDef)
    this.Mods.mapToClass(ModVM) //   https://dexie.org/docs/Typescript#storing-real-classes-instead-of-just-interfaces
  }
}

export const modDB = new BygonzDB()
export class EpochDB extends Dexie {
  // [x: string]: any
  // Declare implicit table properties. (just to inform Typescript. Instanciated by Dexie in stores() method)
  Epochs: Dexie.Table<EpochClass | EpochObj, number> // number = type of the priKey
  spanMs: number
  // ...other tables go here...

  async init () {
    console.log('init')
  }

  constructor (spanMs: number, name: string) {
    super(`Bygonz_${name}EpochDB`)
    this.spanMs = spanMs

    this.version(1).stores({
      Epochs: 'ts, data',
    })

    // addTableRefs(this)
    this.Epochs.mapToClass(EpochClass)
  }
}
