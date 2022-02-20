import Dexie from 'dexie'
import { EpochClass, EpochObj } from '../Model/Epoch'
import { ModVM } from '../Model/Mod'
import { ModObj } from './../Model/Mod'

// const addTableRefs = (dexieInstance: Dexie) => dexieInstance.tables.forEach(table => {
//   dexieInstance[table.name] = table
// })

export class BygonzDB extends Dexie {
  // [x: string]: any
  // Declare implicit table properties. (just to inform Typescript. Instanciated by Dexie in stores() method)
  Mods: Dexie.Table<ModVM | ModObj, [number, string]> // number = type of the priKey
  // ...other tables go here...
  static singletonInstance: BygonzDB

  async init () {
    console.log('init')
  }

  static async getInitializedInstance () {
    if (!this.singletonInstance) {
      this.singletonInstance = new BygonzDB()
      await this.singletonInstance.init()
    }
    return this.singletonInstance
  }

  constructor () {
    super('BygonzDB')

    this.version(1).stores({
      Mods: '[modified+tableName+op], tableName, op, modified, priKey',
      // ...other tables go here...//
    })

    // addTableRefs(this)
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
    super(`${name}EpochDB`)
    this.spanMs = spanMs

    this.version(1).stores({
      Epochs: 'ts, data',
    })

    // addTableRefs(this)
    this.Epochs.mapToClass(EpochClass)
  }
}
