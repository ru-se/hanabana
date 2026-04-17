import { useEffect, useMemo, useRef } from 'react'
import { FLOWERS } from '../lib/flowerGen'
import type { GardenFlower } from '../types'

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v))
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

function hashToUnit(v: string): number {
  let h = 2166136261
  for (let i = 0; i < v.length; i++) {
    h ^= v.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 2 ** 32
}

function rand(id: string, salt: string): number {
  return hashToUnit(`${id}:${salt}`)
}

export function Garden(props: { flowers: GardenFlower[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const dpr = useMemo(() => Math.max(1, Math.min(2, window.devicePixelRatio || 1)), [])

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

    let raf = 0
    const loop = (ts: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      const W = window.innerWidth
      const H = window.innerHeight
      const now = ts

      const groundY = H - 82
      const horizonY = Math.max(120, H - 260)

      const ordered = [...props.flowers].sort((a, b) => a.ySeed - b.ySeed)
      for (const f of ordered) {
        renderFlower(ctx, f, now, W, groundY, horizonY)
      }

      raf = window.requestAnimationFrame(loop)
    }

    raf = window.requestAnimationFrame(loop)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [dpr, props.flowers])

  return <canvas ref={canvasRef} className="c-garden" />
}

function renderFlower(
  ctx: CanvasRenderingContext2D,
  f: GardenFlower,
  nowMs: number,
  W: number,
  groundY: number,
  horizonY: number,
) {
  const def = FLOWERS[f.mood] ?? FLOWERS.moved

  const elapsed = nowMs - f.bornAtMs
  const p = clamp01(elapsed / 1100)
  const grow = easeInOutQuad(p)

  const depth = clamp01(0.12 + 0.88 * f.ySeed)
  const x = (f.xp * W) / 100
  const baseY = horizonY + depth * (groundY - horizonY)

  const depthScale = 0.3 + 0.9 * depth // 0.3..1.2
  const depthOpacity = 0.6 + 0.4 * depth
  const sc = grow * depthScale
  if (sc < 0.01) return

  const stemH = (44 + rand(f.id, 'stemH') * 60) * sc
  const r = (12 + rand(f.id, 'r') * 10) * sc
  const swaySpeed = 0.45 + rand(f.id, 'ss') * 0.9
  const swayOff = rand(f.id, 'so') * Math.PI * 2
  const sway = Math.sin(nowMs / 1000 / (1 / swaySpeed) + swayOff) * 2.2

  ctx.save()
  ctx.globalAlpha = depthOpacity
  ctx.translate(x, baseY)
  ctx.rotate((sway * Math.PI) / 180)

  // stem
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -stemH)
  ctx.strokeStyle = '#7cbf8a'
  ctx.lineWidth = 1.6 * sc
  ctx.stroke()

  ctx.translate(0, -stemH)

  // today highlight glow (pulse 3s)
  if (f.isToday) {
    const t = (nowMs % 3000) / 3000
    const pulse = 0.45 + 0.55 * (0.5 - 0.5 * Math.cos(Math.PI * 2 * t))
    const glowR = r * (1.15 + 0.35 * pulse)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR)
    g.addColorStop(0, `rgba(255,255,255,${0.38 * pulse})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(0, 0, glowR, 0, Math.PI * 2)
    ctx.fill()
  }

  const petalColor = (jitter: number) =>
    `hsl(${def.hue + jitter},${def.sat}%,${def.light}%)`

  if (def.petals === 0) {
    if (f.mood === 'calm') {
      for (let i = -3; i <= 3; i++) {
        ctx.beginPath()
        ctx.ellipse(i * 3 * sc, -(6 + Math.abs(i)) * sc, 2.8 * sc, 8 * sc, 0, 0, Math.PI * 2)
        ctx.fillStyle = petalColor(0)
        ctx.globalAlpha = depthOpacity * 0.85
        ctx.fill()
        ctx.globalAlpha = depthOpacity
      }
    } else {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath()
        ctx.arc(i * 7 * sc, -5 * sc, 5.5 * sc, 0, Math.PI * 2)
        ctx.fillStyle = `hsl(${def.hue},${def.sat}%,${Math.min(92, def.light + 10)}%)`
        ctx.globalAlpha = depthOpacity * 0.8
        ctx.fill()
        ctx.globalAlpha = depthOpacity
      }
    }
  } else {
    for (let i = 0; i < def.petals; i++) {
      const a = (i / def.petals) * Math.PI * 2
      const ppx = Math.cos(a) * r * 0.56
      const ppy = Math.sin(a) * r * 0.56
      ctx.save()
      ctx.translate(ppx, ppy)
      ctx.rotate(a + Math.PI / 2)
      ctx.beginPath()
      ctx.ellipse(0, 0, r * 0.42, r * 0.28, 0, 0, Math.PI * 2)
      const j = (rand(f.id, `p${i}`) - 0.5) * 12
      ctx.fillStyle = petalColor(j)
      ctx.globalAlpha = depthOpacity * 0.87
      ctx.fill()
      ctx.restore()
    }
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.21, 0, Math.PI * 2)
    ctx.fillStyle = '#fff8e1'
    ctx.globalAlpha = depthOpacity
    ctx.fill()
  }

  ctx.restore()
}
