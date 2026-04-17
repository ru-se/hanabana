import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'

export type RippleCanvasHandle = {
  trigger: (x: number, y: number) => void
}

type Ripple = { x: number; y: number; r: number; max: number; a: number; sp: number; delay: number }

export const RippleCanvas = forwardRef<RippleCanvasHandle>(function RippleCanvas(_props, ref) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ripplesRef = useRef<Ripple[]>([])
  const rafRef = useRef<number | null>(null)
  const dpr = useMemo(() => Math.max(1, Math.min(2, window.devicePixelRatio || 1)), [])

  useImperativeHandle(ref, () => ({
    trigger: (x: number, y: number) => {
      const maxAll = 0.6 * Math.hypot(window.innerWidth, window.innerHeight)
      const packs: Array<[number, number, number, number?]> = [
        [0.55, 7, maxAll],
        [0.35, 4, 150, 12],
        [0.22, 2.5, 80, 22],
      ]
      for (const [a, sp, max, delay = 0] of packs) {
        ripplesRef.current.push({ x, y, r: 5, max, a, sp, delay })
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
      ripplesRef.current = ripplesRef.current.filter((r) => {
        if (r.delay > 0) {
          r.delay--
          return true
        }
        r.r += r.sp
        r.a *= 0.91
        if (r.a < 0.004 || r.r > r.max) return false
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(107,168,212,${r.a})`
        ctx.lineWidth = 1.4
        ctx.stroke()
        return true
      })
      rafRef.current = ripplesRef.current.length ? window.requestAnimationFrame(loop) : null
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

  return <canvas ref={canvasRef} className="c-ripple" />
})
