// Maps a status value to the chip colours defined in Dashboard.css / FleetPages.css.
// e.g. <StatusChip value="in_progress" label="In Progress" />  ->  .chip-in-progress
export default function StatusChip({ value, label, prefix = 'chip' }) {
  const key = String(value ?? 'unknown').toLowerCase().replace(/[_\s]+/g, '-')
  return (
    <span className={`fleet-status-chip ${prefix}-${key}`}>
      {label ?? String(value ?? '—').replace(/_/g, ' ')}
    </span>
  )
}
