import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'
import { IconButton } from '@mui/material'
import { useLiveQuery } from 'dexie-react-hooks'
import { h } from 'preact'
import { useRef } from 'preact/hooks'
import { ActiveTasksQuery, completeActiveTask, delActiveTask, updateActiveTask } from '../../Data/data'
import { Task } from '../../Model/Task'
import { utcTs } from '../../Utils/js-utils'
import Editable from '../Editable'

export default function ActiveTask () {
  const ActiveTasks = useLiveQuery(ActiveTasksQuery) ?? []

  const onCheck = (checkedTask: Task) => {
    console.log(checkedTask)
    void completeActiveTask(checkedTask)
  }
  const onDelete = (deletedTask: Task) => {
    void delActiveTask(deletedTask.id)
  }
  const inputRef = useRef<any>()

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
