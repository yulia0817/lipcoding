export function Select({ className = '', options = [], children, ...props }) {
  return (
    <select className={`ds-input ds-select ${className}`.trim()} {...props}>
      {options.map((opt) => {
        const value = typeof opt === 'object' ? opt.value : opt
        const label = typeof opt === 'object' ? opt.label : opt
        return (
          <option key={value} value={value}>
            {label}
          </option>
        )
      })}
      {children}
    </select>
  )
}
