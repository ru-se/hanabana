import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { isSameLocalDay } from '../lib/time'
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

export function Garden(props: { flowers: GardenFlower[]; todayKey: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const flowersRef = useRef(props.flowers)
  const todayKeyRef = useRef(props.todayKey)
  useLayoutEffect(() => {
    flowersRef.current = props.flowers
  }, [props.flowers])
  useLayoutEffect(() => {
    todayKeyRef.current = props.todayKey
  }, [props.todayKey])
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

      const list = flowersRef.current
      const tk = todayKeyRef.current
      const todayList = list.filter((f) => isSameLocalDay(f.createdAtISO, tk))
      if (todayList.length) {
        const xs = todayList.map((f) => (f.xp * W) / 100)
        const pad = W * 0.06
        const left = Math.max(0, Math.min(...xs) - pad)
        const right = Math.min(W, Math.max(...xs) + pad)
        const bandH = 18
        const top = groundY - 8
        ctx.save()
        const g = ctx.createLinearGradient(left, top, right, top)
        g.addColorStop(0, 'rgba(255,255,255,0)')
        g.addColorStop(0.5, 'rgba(255,255,255,0.24)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(left, top - bandH, Math.max(1, right - left), bandH)
        ctx.restore()
      }

      const ordered = getRenderFlowers(list, tk).sort((a, b) => a.ySeed - b.ySeed)
      for (const f of ordered) {
        renderFlower(ctx, f, now, W, groundY, horizonY, tk)
      }

      if (!todayList.length) {
        renderTodayBud(ctx, now, W, groundY)
      }

      raf = window.requestAnimationFrame(loop)
    }

    raf = window.requestAnimationFrame(loop)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [dpr])

  return <canvas ref={canvasRef} className="c-garden" />
}

function getRenderFlowers(list: GardenFlower[], todayKey: string): GardenFlower[] {
  // 500本溜まっても重くなりすぎないよう、描画だけ上限を設ける。
  // 感情的に重要な「今日の花」と「最近の花」は優先する。
  const HARD_LIMIT = 320
  if (list.length <= HARD_LIMIT) return [...list]

  const today = list.filter((f) => isSameLocalDay(f.createdAtISO, todayKey))
  const todaySet = new Set(today.map((f) => f.id))
  const rest = list.filter((f) => !todaySet.has(f.id))

  const recentCount = Math.min(220, rest.length)
  const recent = rest.slice(-recentCount)
  const recentSet = new Set(recent.map((f) => f.id))
  const older = rest.filter((f) => !recentSet.has(f.id))

  const keep = [...today, ...recent]
  const remain = Math.max(0, HARD_LIMIT - keep.length)
  if (!remain || !older.length) return keep

  // 古い花は等間隔サンプリングして「畑が続く感じ」は残す
  const sampled: GardenFlower[] = []
  const step = older.length / remain
  for (let i = 0; i < remain; i++) {
    const idx = Math.min(older.length - 1, Math.floor(i * step))
    sampled.push(older[idx])
  }
  return [...keep, ...sampled]
}

function renderTodayBud(ctx: CanvasRenderingContext2D, nowMs: number, W: number, groundY: number) {
  const x = W * 0.5
  const y = groundY
  const t = (nowMs % 2800) / 2800
  const pulse = 0.45 + 0.55 * (0.5 - 0.5 * Math.cos(Math.PI * 2 * t))

  ctx.save()
  const glow = ctx.createRadialGradient(x, y - 16, 0, x, y - 16, 22)
  glow.addColorStop(0, `rgba(255,255,255,${0.28 * pulse})`)
  glow.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(x, y - 16, 22, 0, Math.PI * 2)
  ctx.fill()

  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x, y - 18)
  ctx.strokeStyle = 'rgba(114, 177, 124, 0.95)'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(x, y - 19, 5.5, 8, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(170, 224, 184, 0.95)'
  ctx.fill()
  ctx.restore()
}

function renderFlower(
  ctx: CanvasRenderingContext2D,
  f: GardenFlower,
  nowMs: number,
  W: number,
  groundY: number,
  horizonY: number,
  todayKey: string,
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
  const stemGrad = ctx.createLinearGradient(0, 0, 0, -stemH)
  stemGrad.addColorStop(0, 'rgba(111,181,123,0.95)')
  stemGrad.addColorStop(1, 'rgba(89,146,102,0.95)')
  ctx.strokeStyle = stemGrad
  ctx.lineWidth = 1.6 * sc
  ctx.stroke()

  ctx.translate(0, -stemH)

  // today highlight glow (pulse 3s)
  if (isSameLocalDay(f.createdAtISO, todayKey)) {
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
      const petalGrad = ctx.createRadialGradient(0, 0, r * 0.06, 0, 0, r * 0.48)
      petalGrad.addColorStop(0, `hsla(${def.hue + j},${Math.min(100, def.sat + 5)}%,${Math.min(96, def.light + 16)}%,0.95)`)
      petalGrad.addColorStop(1, `hsla(${def.hue + j},${def.sat}%,${Math.max(22, def.light - 8)}%,0.92)`)
      ctx.fillStyle = petalGrad
      ctx.globalAlpha = depthOpacity * 0.87
      ctx.fill()
      ctx.restore()
    }
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2)
    const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.32)
    centerGrad.addColorStop(0, 'rgba(255,245,205,0.95)')
    centerGrad.addColorStop(1, 'rgba(246,212,145,0.85)')
    ctx.fillStyle = centerGrad
    ctx.fill()
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.21, 0, Math.PI * 2)
    ctx.fillStyle = '#fff8e1'
    ctx.globalAlpha = depthOpacity
    ctx.fill()
  }

  ctx.restore()
}
