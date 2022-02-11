import { Task } from '../Model/Task'
import { todoDB } from './offline'

const getTaskStates = async function getTaskStates () {
  console.log(await todoDB.ActiveTasks.count(), 'active tasks in db')
  const currentActiveTasks = await todoDB.ActiveTasks.toArray()
  console.log(currentActiveTasks)
}
void getTaskStates()

export const addActiveTask = async (newTask: Task) => await todoDB.ActiveTasks.add(newTask)
export const updateActiveTask = async (taskToUpdate: Task) => await todoDB.ActiveTasks.put(taskToUpdate)
export const delActiveTask = async (idToDelete: number) => await todoDB.ActiveTasks.delete(idToDelete)
export const delCompletedTask = async (idToDelete: number) => await todoDB.CompletedTasks.delete(idToDelete)

export const completeActiveTask = async (idToComplete: number) => {
  const cTask = await todoDB.ActiveTasks.get(idToComplete)
  delete cTask?.id
  cTask && await todoDB.CompletedTasks.add(cTask)
  await todoDB.ActiveTasks.delete(idToComplete)
}

export const ActiveTasksQuery = () => todoDB.ActiveTasks.toArray()
export const CompletedTasksQuery = () => todoDB.CompletedTasks.toArray()
