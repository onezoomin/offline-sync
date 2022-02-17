import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { IconButton } from '@mui/material'
import { useLiveQuery } from 'dexie-react-hooks'
import { h } from 'preact'
import { useRef, useState } from 'preact/hooks'
import { ActiveTasksQuery, completeActiveTask, delActiveTask, updateActiveTask } from '../../Data/data'
import { Task } from '../../Model/Task'
import { TaskStatus } from '../../Model/TaskStatus'
import { utcTs } from '../../Utils/js-utils'
import Editable from '../Editable'

export default function ActiveTask () {
  const [Index, setIndex] = useState(-1)
  const [NewTask, setNewTask] = useState<Task>({ task: '', status: TaskStatus.Active })
  const ActiveTasks = useLiveQuery(ActiveTasksQuery) ?? []
  //   const CompletedTasks = useLiveQuery(CompletedTasksQuery) ?? []

  const onCheck = (checkedTask: Task) => {
    console.log(checkedTask)
    void completeActiveTask(checkedTask)
  }
  const onDelete = (deletedTask: Task) => {
    void delActiveTask(deletedTask.id)
  }
  const inputRef = useRef<any>()

  function handleEditTask (e: any, i: number) {
    // eslint-disable-next-line no-return-assign
    // setNewTask(x => x.task = e.target.value)
    setIndex(i)
  }
  function updateTask (task: Task, newVal) {
    task.task = newVal
    task.modified = utcTs()
    void updateActiveTask(task)
  }

  return (
    <div class="container overflow-y:auto mx-auto mb-5">
      {ActiveTasks?.map((task, i) => {
        const id = task.id ?? i
        return (
          <div key={id} class="flex flex-wrap px-5 md:px-20">
            <IconButton onClick={() => onCheck(task)}>
              <CheckBoxOutlineBlankIcon />
            </IconButton>
            <Editable
                            class="flex-grow w-2/3"
                            text={task.task}
                            placeholder="Write a task name"
                            type="input"
                            childRef={inputRef}
                            handleOnInput = {(e: any) => handleEditTask(e, i)}
                            onEnter = {(e: KeyboardEvent) => updateTask(task, (e.target as HTMLInputElement)?.value)}
                        />
            <IconButton onClick={() => onDelete(task)}>
              <DeleteForeverIcon />
            </IconButton>
          </div>
        )
      })}
    </div>
  )
}
