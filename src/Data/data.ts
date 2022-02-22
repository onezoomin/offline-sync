import format from 'date-fns/format'
import fromUnixTime from 'date-fns/fromUnixTime'
import { TaskStatus } from '../Model/TaskStatus'
import { sleep } from '../Utils/js-utils'
import { CompoundKeyNumStr, Task, TaskParams, TaskVM, userAddress } from './../Model/Task'
import { modDB, utcMsTs } from './bygonz'
import { todoDB } from './WebWorker'

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
  await todoDB.ActiveTasks.add(newTask)
}
export const updateActiveTask = async (taskToUpdate: Task) => await todoDB.ActiveTasks.put(new Task({ ...taskToUpdate, modified: utcMsTs() }))
export const delActiveTask = async (idToDelete: CompoundKeyNumStr) => await todoDB.ActiveTasks.delete(idToDelete)
export const delCompletedTask = async (idToDelete: CompoundKeyNumStr) => await todoDB.CompletedTasks.delete(idToDelete)
export const completeActiveTask = async (cTask: Task) => cTask
  && (await todoDB.CompletedTasks.add(new Task({ ...cTask, status: TaskStatus.Completed, modified: utcMsTs() })))
  && (await todoDB.ActiveTasks.delete((cTask as TaskVM).id))

export const ActiveTasksQuery = () => todoDB.ActiveTasks.orderBy('modified').toArray()
export const CompletedTasksQuery = () => todoDB.CompletedTasks.toArray()
export const ModificationsQuery = (key: CompoundKeyNumStr = [0, '']) => modDB.Mods.where('forKey').equals(key).toArray()

export const mockUpdateStreamer = async () => {
  let eventCount = 0
  const maxUpdates = 4
  const tableRef = todoDB.ActiveTasks

  while (eventCount++ < maxUpdates) {
    let key, task

    const taskArray = await tableRef.toArray()
    const addPercentage = 0.25
    if (Math.random() >= addPercentage && taskArray.length) {
      key = (taskArray[Math.floor(Math.random() * taskArray.length)] as TaskVM)?.id
      const modified = utcMsTs()
      const modTime = format(fromUnixTime(modified / 1000), 'H:mm:ss:SSS')
      task = `upd by ${userAddress.slice(0, 5)} @ ${modTime}`
      await tableRef.update(key, { task, modified })
    } else {
      task = `${userAddress.slice(0, 5)} create ${(Math.random() * 2000).toFixed(0)}`
      await tableRef.add(new Task({ task, status: TaskStatus.Active }))
    }
    console.log('waiting 30s ', maxUpdates - eventCount, ' more times')

    await sleep(30000)
  }
}

void mockUpdateStreamer()
