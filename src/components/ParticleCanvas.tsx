import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import { FLOWERS } from '../lib/flowerGen'
import type { Mood } from '../types'

export type ParticleCanvasHandle = {
  spawn: (x: number, y: number, mood: Mood) => void
}

type Part = { x: number; y: number; vx: number; vy: number; r: number; a: number; c: string }

export const ParticleCanvas = forwardRef<ParticleCanvasHandle>(function ParticleCanvas(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const partsRef = useRef<Part[]>([])
  const rafRef = useRef<number | null>(null)
  const dpr = useMemo(() => Math.max(1, Math.min(2, window.devicePixelRatio || 1)), [])

  useImperativeHandle(ref, () => ({
    spawn: (x: number, y: number, mood: Mood) => {
      const def = FLOWERS[mood] ?? FLOWERS.moved
      for (let i = 0; i < 20; i++) {
        const a = Math.random() * Math.PI * 2
        const sp = 1.8 + Math.random() * 3.8
        partsRef.current.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 2.2,
          r: 3 + Math.random() * 5,
          a: 0.88,
          c: `hsl(${def.hue + (Math.random() - 0.5) * 18},${def.sat}%,${def.light}%)`,
        })
      }
      if (!rafRef.current) start()
    },
  }))

  const start = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const loop = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      partsRef.current = partsRef.current.filter((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.13
        p.a *= 0.92
        if (p.a < 0.01) return false
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.c
        ctx.globalAlpha = p.a
        ctx.fill()
        ctx.globalAlpha = 1
        return true
      })
      rafRef.current = partsRef.current.length ? window.requestAnimationFrame(loop) : null
      if (!rafRef.current) ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }

    rafRef.current = window.requestAnimationFrame(loop)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = Math.floor(window.innerWidth * dpr)
      canvas.height = Math.floor(window.innerHeight * dpr)
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [dpr])

  return <canvas ref={canvasRef} className="c-particle" />
})
