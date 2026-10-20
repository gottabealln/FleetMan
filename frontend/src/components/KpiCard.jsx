export default function KpiCard({ title, value, subtitle, variant = 'blue', icon }) {
  const variants = {
    blue:    'from-blue-500 to-indigo-600 shadow-blue-500/30',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/30',
    violet:  'from-violet-500 to-purple-600 shadow-violet-500/30',
    amber:   'from-amber-500 to-orange-600 shadow-amber-500/30',
    rose:    'from-rose-500 to-pink-600 shadow-rose-500/30',
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${variants[variant]} hover:scale-[1.02] hover:shadow-2xl`}
    >
      {/* decorative circle */}
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-4 w-24 h-24 rounded-full bg-white/10 blur-xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider opacity-90">{title}</div>
          {icon && <div className="text-2xl opacity-80">{icon}</div>}
        </div>
        <div className="text-4xl font-extrabold mt-2">{value}</div>
        {subtitle && <div className="text-xs mt-1 opacity-80">{subtitle}</div>}
      </div>
    </div>
  )
}