import { h } from 'preact';
import { Task } from '../Model/Task';
import { Tasks } from '../Model/Tasks';
const taskId: string = "1";
const pkId: string = "1";

var url = ``;
if (process.env.NODE_ENV == "development") {
    url = `http://localhost:7071`;
}
export async function getTasks() {
    console.log("fetchings tasks using getTasks")
    return await fetch(url + `/api/getTasks?id=${taskId}&partitionKeyValue=${pkId}`)
        .then(res => res.json());
}

export async function updateTasks(taskArr: Task[]) {
    console.log("Posting tasks");
    const tasks:Tasks = {id:taskId,tasks:taskArr}
    await fetch(url + `/api/putTasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasks)
    }).then(response => {console.log(response)}).catch(err => {console.log(err)})
}