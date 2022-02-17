import { utcTs } from '../Utils/js-utils'

export enum ModType {
  CREATE='C',
  READ='R',
  UPDATE='U',
  DELETE='D'
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

  constructor (taskOptions: ModOpts) {
    super(taskOptions)
    Object.assign(this, taskOptions)
  }
}
export class Mod extends ModOpts {
  public get type (): string {
    return `${this.log.toString()}`
  }
}
