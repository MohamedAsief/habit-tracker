import { DAY_LABELS, toDateStr } from '../utils/dates.js'

export default function WeekRow({ weekDays, today }) {
  const todayStr = toDateStr(today)
  return (
    <div className="flex px-3 mb-2">
      <div style={{ width: '30%', minWidth: 95, flexShrink: 0 }} />
      <div className="flex flex-1 gap-1.5">
        {weekDays.map(day => {
          const str = toDateStr(day)
          const isToday = str === todayStr
          const isFut   = day > today
          return (
            <div key={str} className="flex-1 flex flex-col items-center gap-0.5">
              <span className={`font-mono text-[10px] uppercase tracking-wider font-semibold
                ${isToday ? 'text-accent' : 'text-muted opacity-60'}`}>
                {DAY_LABELS[day.getDay()].slice(0,2)}
              </span>
              <span className={`text-sm font-bold ${isToday ? 'text-white bg-accent w-7 h-7 rounded-full flex items-center justify-center'
                : isFut ? 'text-muted opacity-25' : 'text-muted opacity-60'}`}
                style={isToday ? { display:'flex', alignItems:'center', justifyContent:'center' } : {}}>
                {day.getDate()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
