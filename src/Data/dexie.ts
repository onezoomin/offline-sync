import { TodoDB } from './WebWorker'
export const todoDB = await TodoDB.getInitializedInstance()
