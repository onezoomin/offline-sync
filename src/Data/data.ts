import { TaskStatus } from '../Model/TaskStatus'
import { CompoundKeyNumStr, Task, TaskParams, TaskVM } from './../Model/Task'
import { modDB, utcMsTs } from './bygonz'
import { todoDB } from './dexie'
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
  await todoDB.ActiveTasks.put(newTask)
}
export const updateActiveTask = async (taskToUpdate: Task) => await todoDB.ActiveTasks.update(TaskVM.getCompoundKey(taskToUpdate), { task: taskToUpdate.task, modified: utcMsTs() })
// disabled cuz it looks like an add : // export const updateActiveTask = async (taskToUpdate: Task) => await todoDB.ActiveTasks.put(new Task({ ...taskToUpdate, modified: utcMsTs() }), TaskVM.getCompoundKey(taskToUpdate))
export const delActiveTask = async (idToDelete: CompoundKeyNumStr) => await todoDB.ActiveTasks.delete(idToDelete)
export const delCompletedTask = async (idToDelete: CompoundKeyNumStr) => await todoDB.CompletedTasks.delete(idToDelete)
export const completeActiveTask = async (cTask: Task) => cTask
  && (await todoDB.CompletedTasks.add(new Task({ ...cTask, status: TaskStatus.Completed, modified: utcMsTs() })))
  && (await todoDB.ActiveTasks.delete((cTask as TaskVM).id))

export const ActiveTasksQuery = () => todoDB.ActiveTasks.toArray() /// orderBy('modified').
export const CompletedTasksQuery = () => todoDB.CompletedTasks.toArray()
export const ModificationsQuery = (key: CompoundKeyNumStr = [0, '']) => modDB.Mods.where('forKey').equals(key).toArray()
