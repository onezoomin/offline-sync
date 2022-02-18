import { h } from 'preact'
import { MutableRef, useEffect, useState } from 'preact/hooks'

const Editable = (passed: { text: string, type: string, placeholder: string, childRef: MutableRef<any>, onEnter: (e: KeyboardEvent) => void, [x: string]: any }) => {
  const { text, type, placeholder, childRef, onEnter, ...props } = passed
  const [isEditing, setEditing] = useState(false)

  useEffect(() => {
    if (childRef?.current && isEditing) {
      childRef.current.focus()
    }
  }, [isEditing, childRef])

  function HandleKeyDown (event: any, type: any): void {
    const { key } = event
    const alternateSubmitKeys = ['Tab', 'Enter']
    if (type === 'input') {
      if (key === 'Escape') {
        setEditing(false)
      } else if (alternateSubmitKeys.includes(key) && event.target.value !== '') {
        setEditing(false)
        onEnter(event)
      }
    }
  }

  function handleFocus (e: any) {
    if (e.type === 'blur') {
      setEditing(false)
    } else if (e.type === 'focus') {
      console.log('trying to focus')
      window.scrollTo(0, 240)
    }
  }

  return (
    <section {...props}>
      {isEditing
        ? (
          <div>
            <input
            required
            minLength={1}
            maxLength={32}
            ref={childRef}
            className="sm:h-6 w-10/12 md:h-8 shadow appearance-none border rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent focus:shadow-outline text-gray-700 text-center leading-tight"
            type="text"
            name="task"
            placeholder={placeholder}
            value={text}
            onKeyDown={(e: any) => HandleKeyDown(e, type)}
            onFocus={handleFocus}
            onBlur={handleFocus}
          />
          </div>
          )
        : (
          <div
          id="editableLabel"
          className={`leading-tight overflow-ellipsis overflow-hidden whitespace-pre-wrap editable-${type}`}
          onClick={() => setEditing(true)}
        >
            <span>
              {text}
            </span>
          </div>
          )}
    </section>
  )
}

export default Editable
