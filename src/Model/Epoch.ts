import { utcMsTs } from '../Data/bygonz'
export class EpochObj {
  data: string
  ts?: number

  constructor (params: EpochObj) {
    params.ts = params.ts ?? utcMsTs()
    Object.assign(this, params)
  }
}
export class EpochClass extends EpochObj {
  declare ts: number
  public get hashCalc (): number {
    return this.data.length
  }
}
