export function EmptyState({ icon = '📭', title, description, action, className = '' }) {
  return (
    <div className={`ds-empty ${className}`.trim()}>
      <div className="ds-empty__icon">{icon}</div>
      {title && <p className="ds-empty__title">{title}</p>}
      {description && <p className="ds-empty__desc">{description}</p>}
      {action && <div className="ds-empty__action">{action}</div>}
    </div>
  )
}
