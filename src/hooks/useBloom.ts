import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { detectMood } from '../lib/moodDetect'
import { flowerToastText } from '../lib/flowerGen'
import type { Memory, Mood } from '../types'

export type UseBloomArgs = {
  addMemory: (args: { text: string; mood: Mood; xp: number; createdAtISO?: string }) => Promise<Memory>
  onWaterDrop?: () => void
  onFlash: () => void
  onRipple: (x: number, y: number) => void
  onParticles: (x: number, y: number, mood: Mood) => void
  onBloom: (m: Memory) => void
  onToast: (msg: string) => void
}

export function useBloom(args: UseBloomArgs): { isBusy: boolean; submit: (text: string) => Promise<void> } {
  const [isBusy, setIsBusy] = useState(false)
  const activeId = useRef(0)
  const argsRef = useRef(args)
  useLayoutEffect(() => {
    argsRef.current = args
  })
  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t))
    timersRef.current = []
  }

  const submit = useCallback(async (text: string) => {
    const t = text.trim()
    if (t.length < 2) return

    const myId = ++activeId.current
    clearTimers()
    setIsBusy(true)
    const startedAt = performance.now()

    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2 + 10

    argsRef.current.onWaterDrop?.()
    argsRef.current.onFlash()
    argsRef.current.onRipple(cx, cy)

    let mood: Mood = 'moved'
    try {
      const res = await detectMood(t)
      mood = res.mood
    } catch {
      mood = 'moved'
    }

    if (activeId.current !== myId) return

    const elapsed = performance.now() - startedAt
    const waitParticles = Math.max(0, 550 - elapsed)
    const waitBloom = Math.max(0, 800 - elapsed)

    const particlesT = window.setTimeout(() => {
      if (activeId.current !== myId) return
      argsRef.current.onParticles(cx, cy, mood)
    }, waitParticles)
    timersRef.current.push(particlesT)

    const bloomT = window.setTimeout(() => {
      void (async () => {
        if (activeId.current !== myId) return
        try {
          const xp = 4 + Math.random() * 92
          const mem = await argsRef.current.addMemory({ text: t, mood, xp })
          if (activeId.current !== myId) return
          argsRef.current.onBloom(mem)
          argsRef.current.onToast(flowerToastText(mood))
        } finally {
          if (activeId.current === myId) setIsBusy(false)
        }
      })()
    }, waitBloom)
    timersRef.current.push(bloomT)
  }, [])

  return { isBusy, submit }
}
