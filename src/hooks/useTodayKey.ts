import { useEffect, useState } from 'react'

/** ローカル日付が変わったら更新（今日ハイライトの日付またぎ対策） */
export function useTodayKey(): string {
  const [k, setK] = useState(() => new Date().toDateString())

  useEffect(() => {
    const tick = () => {
      const next = new Date().toDateString()
      setK((prev) => (prev !== next ? next : prev))
    }
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
  }, [])

  return k
}
