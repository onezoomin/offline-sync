import format from 'date-fns/format'
import fromUnixTime from 'date-fns/fromUnixTime'
import { Table } from 'dexie'
import { TaskStatus } from '../Model/TaskStatus'
import { sleep } from '../Utils/js-utils'
import { CompoundKeyNumStr, Task, TaskParams, TaskVM } from './../Model/Task'
import { modDB, utcMsTs } from './bygonz'
import { todoDB } from './dexie'
import { userAddress } from './wallet'

// const getTaskStates = async function getTaskStates () {
//   console.log(await todoDB.ActiveTasks.count(), 'active tasks in db')
//   const currentActiveTasks = await todoDB.ActiveTasks.toArray()
//   console.log(currentActiveTasks)
// }
// void getTaskStates()
// void rxInit()
// void gitInit()
// void initRepli()
// void initHyper() node only for now...

export const addActiveTask = async (newTask: TaskParams) => {
  console.log('adding', newTask)
  await todoDB.ActiveTasks.put(newTask)
}
export const updateActiveTask = async (taskToUpdate: Task) => await todoDB.ActiveTasks.update(TaskVM.getCompoundKey(taskToUpdate), { task: taskToUpdate.task, modified: utcMsTs() })
// disabled cuz it looks like an add : // export const updateActiveTask = async (taskToUpdate: Task) => await todoDB.ActiveTasks.put(new Task({ ...taskToUpdate, modified: utcMsTs() }), TaskVM.getCompoundKey(taskToUpdate))
export const delActiveTask = async (idToDelete: CompoundKeyNumStr) => await todoDB.ActiveTasks.delete(idToDelete)
export const delCompletedTask = async (idToDelete: CompoundKeyNumStr) => await todoDB.CompletedTasks.delete(idToDelete)
export const completeActiveTask = async (cTask: Task) => cTask
  && (await todoDB.CompletedTasks.add(new Task({ ...cTask, status: TaskStatus.Completed, modified: utcMsTs() })))
  && (await todoDB.ActiveTasks.delete((cTask as TaskVM).id))

export const ActiveTasksQuery = () => todoDB.ActiveTasks.orderBy('modified').reverse().toArray() /// orderBy('modified').
export const ActiveTasksSinceQuery = (since: number) => todoDB.ActiveTasks.where('modified').aboveOrEqual(since).toArray() /// orderBy('modified').
export const CompletedTasksQuery = () => todoDB.CompletedTasks.orderBy('modified').reverse().toArray()
export const ModificationsQuery = (key: CompoundKeyNumStr = [0, '']) => modDB.Mods.where('forKey').equals(key).toArray()

const mockUpdateStreamer = async () => {
  let eventCount = 0
  const maxUpdates = 20
  const tableRef: Table = todoDB.ActiveTasks

  while (eventCount++ < maxUpdates) {
    let key, task

    const taskArray = (await tableRef.toArray()) as TaskVM[]
    const addPercentage = 0.25
    const modified = utcMsTs()
    const modTime = format(fromUnixTime(modified / 1000), 'H:mm:ss:SSS')
    if (Math.random() >= addPercentage && taskArray.length) {
      key = (taskArray[Math.floor(Math.random() * taskArray.length)])?.id
      task = `upd by ${userAddress.slice(0, 5)} @ ${modTime}`
      await tableRef.update(key, { task, modified })
    } else {
      task = `${userAddress.slice(0, 5)} create ${(Math.random() * 2000).toFixed(0)} @ ${modTime}`
      await tableRef.add(new Task({ task, created: modified, modified, owner: userAddress, status: TaskStatus.Active }))
    }
    console.log('will automock in 30s ', maxUpdates - eventCount, ' more times')

    await sleep(30000)
  }
}

void mockUpdateStreamer()
