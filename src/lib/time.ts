export function weekKey(d: Date): string {
  const day = new Date(d)
  day.setHours(0, 0, 0, 0)
  const dow = day.getDay()
  const diff = day.getDate() - dow + (dow === 0 ? -6 : 1) // Monday start
  day.setDate(diff)
  return `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`
}

export function isSameLocalDay(aISO: string, todayKey: string): boolean {
  return new Date(aISO).toDateString() === todayKey
}

export function formatDateTimeShort(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const hh = d.getHours()
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}/${m}/${day} ${hh}:${mm}`
}

export function weekLabel(k: string): string {
  const [y, m, d] = k.split('-').map(Number)
  const s = new Date(y, m - 1, d)
  const e = new Date(s)
  e.setDate(e.getDate() + 6)
  const tw = weekKey(new Date())
  if (k === tw) return '今週'
  return `${s.getMonth() + 1}/${s.getDate()}〜${e.getMonth() + 1}/${e.getDate()}`
}
