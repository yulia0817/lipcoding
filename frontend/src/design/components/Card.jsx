export function Card({ as: Tag = 'div', className = '', ...props }) {
  return <Tag className={`ds-card ${className}`.trim()} {...props} />
}
