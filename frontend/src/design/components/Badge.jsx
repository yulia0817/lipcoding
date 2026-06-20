export function Badge({ variant = 'primary', className = '', ...props }) {
  return (
    <span className={`ds-badge ds-badge--${variant} ${className}`.trim()} {...props} />
  )
}
