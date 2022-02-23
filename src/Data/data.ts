import { TaskStatus } from '../Model/TaskStatus'
import { CompoundKeyNumStr, Task, TaskParams, TaskVM } from './../Model/Task'
import { modDB, utcMsTs } from './bygonz'
import { todoDB } from './dexie'
import { userAddress } from './wallet'
// const todoDB = new TodoDB()

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
export const updateActiveTask = async (taskToUpdate: Task) => await todoDB.ActiveTasks.put(new Task({ ...taskToUpdate, owner: userAddress, modified: utcMsTs() }))
export const delActiveTask = async (idToDelete: CompoundKeyNumStr) => await todoDB.ActiveTasks.delete(idToDelete)
export const delCompletedTask = async (idToDelete: CompoundKeyNumStr) => await todoDB.CompletedTasks.delete(idToDelete)
export const completeActiveTask = async (cTask: Task) => cTask
  && (await todoDB.CompletedTasks.add(new Task({ ...cTask, status: TaskStatus.Completed, modified: utcMsTs() })))
  && (await todoDB.ActiveTasks.delete((cTask as TaskVM).id))

export const ActiveTasksQuery = () => todoDB.ActiveTasks.orderBy('modified').toArray()
export const CompletedTasksQuery = () => todoDB.CompletedTasks.toArray()
export const ModificationsQuery = (key: CompoundKeyNumStr = [0, '']) => modDB.Mods.where('forKey').equals(key).toArray()
