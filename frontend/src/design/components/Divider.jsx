export function Divider({ className = '', ...props }) {
  return <hr className={`ds-divider ${className}`.trim()} {...props} />
}
