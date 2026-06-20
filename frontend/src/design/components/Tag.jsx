export function Tag({ className = '', onRemove, children, ...props }) {
  return (
    <span className={`ds-tag ${className}`.trim()} {...props}>
      {children}
      {onRemove && (
        <button type="button" className="ds-tag__remove" onClick={onRemove} aria-label="제거">
          ✕
        </button>
      )}
    </span>
  )
}
