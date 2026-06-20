export function Stack({ gap = 2, row = false, className = '', ...props }) {
  const base = row ? 'ds-row' : 'ds-stack'
  return <div className={`${base} ds-gap-${gap} ${className}`.trim()} {...props} />
}
