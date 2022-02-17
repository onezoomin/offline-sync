import { utcTs } from '../Utils/js-utils'

export enum Operations {
  CREATE='C',
  READ='R',
  UPDATE='U',
  DELETE='D'
}
export const OpCodes = {
  C: 'CREATE',
  R: 'READ',
  U: 'UPDATE',
  D: 'DELETE',
}

export class TimeStamped {
  created?: number
  modified?: number

  constructor (taskOptions: TimeStamped) {
    taskOptions.created = taskOptions.created ?? utcTs()
    taskOptions.modified = taskOptions.modified ?? taskOptions.created

    Object.assign(this, taskOptions)
  }
}
export class ModOpts extends TimeStamped {
  log: Record<any, any>
  priKey: [number, string]
  op: Operations

  constructor (taskOptions: ModOpts) {
    super(taskOptions)
    Object.assign(this, taskOptions)
  }
}
export class Mod extends ModOpts {
  public get opString (): string {
    return OpCodes[this.op]
  }
}
