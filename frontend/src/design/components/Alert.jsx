export function Alert({ variant = 'info', className = '', ...props }) {
  return (
    <div
      role="alert"
      className={`ds-alert ds-alert--${variant} ${className}`.trim()}
      {...props}
    />
  )
}
