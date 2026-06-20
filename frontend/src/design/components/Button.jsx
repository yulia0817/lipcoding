export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`ds-btn ds-btn--${variant} ds-btn--${size} ${className}`.trim()}
      {...props}
    />
  )
}
