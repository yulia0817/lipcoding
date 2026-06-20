export function Input({ className = '', ...props }) {
  return <input className={`ds-input ${className}`.trim()} {...props} />
}
