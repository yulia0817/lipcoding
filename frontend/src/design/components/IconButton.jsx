export function IconButton({ variant = 'default', className = '', ...props }) {
  const variantClass = variant === 'danger' ? 'ds-icon-btn--danger' : ''
  return (
    <button
      type="button"
      className={`ds-icon-btn ${variantClass} ${className}`.trim()}
      {...props}
    />
  )
}
