import {h} from 'preact'
import { StateUpdater } from 'preact/hooks';

export default function DeleteButton(props:any) {
    const onDelete: StateUpdater<number> = props.onDelete;
    const i:number = props.index;
    return (
        <div>
            <button class="flex-none px-2" type="delete" onClick={() => onDelete(i)}>
                <svg xmlns="http://www.w3.org/2000/svg" class=" h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    )
}
