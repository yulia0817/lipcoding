export function Textarea({ className = '', rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`ds-input ds-textarea ${className}`.trim()}
      {...props}
    />
  )
}
