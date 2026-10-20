// tone: 'navy' | 'green' | 'gold' | 'red'   dark: use the navy gradient card
export default function FleetKpi({ title, value, subtitle, icon, tone = 'navy', dark = false }) {
  return (
    <article className={`fleet-kpi${dark ? ' is-dark' : ''}`}>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
      <span className={`fleet-kpi-icon tone-${tone} material-symbols-outlined`} aria-hidden="true">{icon}</span>
    </article>
  )
}
