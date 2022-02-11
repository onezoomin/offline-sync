import { h } from 'preact'

export const FlexRow = ({ className = '', children }) => {
  className = `flex flex-row ${className}`
  return (
    <div {...{ className }}>
      {children}
    </div>
  )
}
export const FlexCol = ({ className = '', children }) => {
  className = `flex flex-col ${className}`
  return (
    <div {...{ className }}>
      {children}
    </div>
  )
}
