export function Checkbox({ className = '', ...props }) {
  return (
    <input type="checkbox" className={`ds-checkbox ${className}`.trim()} {...props} />
  )
}
