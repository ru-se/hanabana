import { useCallback, useRef, useState } from 'react'
import { detectMood } from '../lib/moodDetect'
import { flowerToastText } from '../lib/flowerGen'
import type { Memory, Mood } from '../types'

export function useBloom(args: {
  addMemory: (args: { text: string; mood: Mood; xp: number; createdAtISO?: string }) => Promise<Memory>
  onFlash: () => void
  onRipple: (x: number, y: number) => void
  onParticles: (x: number, y: number, mood: Mood) => void
  onBloom: (m: Memory) => void
  onToast: (msg: string) => void
}): { isBusy: boolean; submit: (text: string) => Promise<void> } {
  const [isBusy, setIsBusy] = useState(false)
  const activeId = useRef(0)

  const submit = useCallback(
    async (text: string) => {
      const t = text.trim()
      if (t.length < 2) return

      const myId = ++activeId.current
      setIsBusy(true)

      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2 + 10

      let mood: Mood = 'moved'
      try {
        const res = await detectMood(t)
        mood = res.mood
      } catch {
        mood = 'moved'
      }

      if (activeId.current !== myId) return

      args.onFlash()
      args.onRipple(cx, cy)

      const particlesT = window.setTimeout(() => {
        if (activeId.current !== myId) return
        args.onParticles(cx, cy, mood)
      }, 550)

      const bloomT = window.setTimeout(async () => {
        if (activeId.current !== myId) return

        const xp = 4 + Math.random() * 92
        const mem = await args.addMemory({ text: t, mood, xp })
        if (activeId.current !== myId) return

        args.onBloom(mem)
        args.onToast(flowerToastText(mood))
        setIsBusy(false)
      }, 800)

      // if something triggers a new submit, timers from this run should no-op
      void particlesT
      void bloomT
    },
    [args],
  )

  return { isBusy, submit }
}
