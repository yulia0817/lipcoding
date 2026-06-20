export function Spinner({ size = 20, className = '', label = '로딩 중' }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`ds-spinner ${className}`.trim()}
      style={{ width: size, height: size }}
    />
  )
}
