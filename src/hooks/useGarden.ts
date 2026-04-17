import { useCallback, useEffect, useRef, useState } from 'react'
import { isSameLocalDay } from '../lib/time'
import type { GardenFlower, Memory } from '../types'

function hashToUnit(v: string): number {
  let h = 2166136261
  for (let i = 0; i < v.length; i++) {
    h ^= v.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 2 ** 32
}

export function useGarden(
  memories: Memory[],
  todayKey: string,
): {
  flowers: GardenFlower[]
  isFlashOn: boolean
  flash: () => void
  bloomFromMemory: (m: Memory) => void
} {
  const [isFlashOn, setIsFlashOn] = useState(false)
  const [flowers, setFlowers] = useState<GardenFlower[]>([])
  const knownIds = useRef(new Set<string>())
  const flashTimer = useRef<number | null>(null)

  const flash = useCallback(() => {
    setIsFlashOn(true)
    if (flashTimer.current) window.clearTimeout(flashTimer.current)
    // CSS の opacity 遷移(60ms)と揃え、審査デモで一瞬が見えるようにする
    flashTimer.current = window.setTimeout(() => setIsFlashOn(false), 70)
  }, [])

  const bloomFromMemory = useCallback(
    (m: Memory) => {
      const now = performance.now()
      const f: GardenFlower = {
        id: m.id,
        mood: m.mood,
        xp: m.xp,
        ySeed: hashToUnit(m.id),
        bornAtMs: now,
        createdAtISO: m.created_at,
        isToday: isSameLocalDay(m.created_at, todayKey),
      }
      knownIds.current.add(m.id)
      setFlowers((prev) => [...prev, f].slice(-140))
    },
    [todayKey],
  )

  useEffect(() => {
    const now = performance.now()
    const incoming = memories.slice(-120)
    const missing = incoming.filter((m) => !knownIds.current.has(m.id))
    if (!missing.length) return

    setFlowers((prev) => {
      const next = [...prev]
      for (const m of missing) {
        knownIds.current.add(m.id)
        next.push({
          id: m.id,
          mood: m.mood,
          xp: m.xp,
          ySeed: hashToUnit(m.id),
          bornAtMs: now - 1600,
          createdAtISO: m.created_at,
          isToday: isSameLocalDay(m.created_at, todayKey),
        })
      }
      return next.slice(-140)
    })
  }, [memories, todayKey])

  useEffect(() => {
    return () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current)
    }
  }, [])

  return { flowers, isFlashOn, flash, bloomFromMemory }
}
