import { useEffect, useMemo, useRef, useState } from 'react'
import { FLOWERS } from '../lib/flowerGen'
import { formatDateTimeShort, isSameLocalDay, weekLabel } from '../lib/time'
import type { Memory } from '../types'

type WordFloat = { id: string; text: string; leftPct: number; bottomPct: number }
type MiniFlower = {
  id: string
  mood: Memory['mood']
  xp: number
  bornAtMs: number
  isToday: boolean
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v))
}
function easeInOutQuad(t: number) {
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

export function RecapPanel(props: {
  open: boolean
  onClose: () => void
  weeks: string[]
  memories: Memory[]
  todayKey: string
}) {
  const { onClose } = props
  const [selWeek, setSelWeek] = useState<string>(() => props.weeks[0] ?? '')
  const [words, setWords] = useState<WordFloat[]>([])
  const [countUp, setCountUp] = useState<number>(0)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const timersRef = useRef<number[]>([])
  const miniFlowersRef = useRef<MiniFlower[]>([])

  const wk = useMemo(() => {
    if (props.weeks.includes(selWeek)) return selWeek
    return props.weeks[0] ?? ''
  }, [props.weeks, selWeek])

  const weekMemories = useMemo(() => {
    if (!wk) return []
    return props.memories.filter((m) => m.week_key === wk).sort((a, b) => (a.created_at > b.created_at ? 1 : -1))
  }, [props.memories, wk])

  const moodSummary = useMemo(() => {
    if (!weekMemories.length) return null
    const counts = weekMemories.reduce<Record<string, number>>((acc, m) => {
      acc[m.mood] = (acc[m.mood] || 0) + 1
      return acc
    }, {})
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (!top) return null
    const mood = top[0] as Memory['mood']
    const count = top[1]
    const flower = FLOWERS[mood] ?? FLOWERS.moved
    const commentByMood: Record<Memory['mood'], string> = {
      happy: '軽やかな瞬間が多い週でした。',
      love: 'やさしさを感じる時間が多い週でした。',
      moved: '心がじんわり動く場面が多い週でした。',
      calm: '穏やかな呼吸で過ごせた週でした。',
      tired: '頑張りを積み重ねた週でした。',
      fun: 'わくわくした気持ちが多い週でした。',
    }
    return {
      flowerName: flower.name,
      emoji: flower.emoji,
      count,
      comment: commentByMood[mood],
    }
  }, [weekMemories])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const resize = () => {
      const parent = canvas.parentElement
      const W = parent ? parent.clientWidth : 300
      const H = 160
      canvas.width = Math.floor(W)
      canvas.height = Math.floor(H)
      canvas.style.width = `${W}px`
      canvas.style.height = `${H}px`
    }

    resize()
    window.addEventListener('resize', resize)

    const loop = (ts: number) => {
      const W = canvas.width
      const H = canvas.height
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = '#c8e6c9'
      ctx.fillRect(0, H - 28, W, 28)

      for (const f of miniFlowersRef.current) {
        renderMiniFlower(ctx, f, ts, W, H)
      }

      rafRef.current = window.requestAnimationFrame(loop)
    }
    rafRef.current = window.requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [props.todayKey])

  useEffect(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t))
    timersRef.current = []
    miniFlowersRef.current = []

    const total = weekMemories.length
    if (!total) return

    weekMemories.forEach((m, i) => {
      const t = window.setTimeout(() => {
        miniFlowersRef.current.push({
          id: m.id,
          mood: m.mood,
          xp: m.xp || (8 + (i / Math.max(total - 1, 1)) * 84),
          bornAtMs: performance.now(),
          isToday: isSameLocalDay(m.created_at, props.todayKey),
        })

        const wt: WordFloat = {
          id: `${m.id}:${performance.now()}`,
          text: m.text.length > 16 ? `${m.text.slice(0, 16)}…` : m.text,
          leftPct: 6 + Math.random() * 74,
          bottomPct: 15 + Math.random() * 52,
        }
        setWords((prev) => [...prev, wt])
        window.setTimeout(() => setWords((prev) => prev.filter((x) => x.id !== wt.id)), 3400)
      }, i * 600)
      timersRef.current.push(t)
    })

    const doneT = window.setTimeout(() => {
      const start = performance.now()
      const dur = 700
      const tick = () => {
        const p = clamp01((performance.now() - start) / dur)
        setCountUp(Math.round(total * p))
        if (p < 1) window.requestAnimationFrame(tick)
      }
      tick()
    }, total * 600 + 300)
    timersRef.current.push(doneT)
  }, [props.todayKey, weekMemories])

  if (!props.open) return null

  const title = wk ? `${weekLabel(wk)}の花畑` : '今週の花畑'
  const total = weekMemories.length
  const sub = total ? `${countUp || total}個の幸せを貯めました` : 'まだ幸せが貯まっていません'

  return (
    <div
      className={`recapOverlay recapOpen`}
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('recapOverlay')) props.onClose()
      }}
      aria-hidden={false}
    >
      <div className="recapPanel" role="dialog" aria-modal="true">
        <div className="rh">
          <span>{title}</span>
          <button className="rcls" onClick={props.onClose} aria-label="閉じる">
            ×
          </button>
        </div>
        <div className="rsub">{sub}</div>
        {moodSummary ? (
          <div className="moodSummary">
            <div className="moodSummaryTitle">
              {moodSummary.emoji} 今週いちばん多かった花は「{moodSummary.flowerName}」({moodSummary.count}本)
            </div>
            <div className="moodSummaryText">{moodSummary.comment}</div>
          </div>
        ) : null}

        <div className="wtabs">
          {props.weeks.slice(0, 6).map((w) => (
            <button
              key={w}
              className={`wtab ${w === wk ? 'wtabOn' : ''}`}
              onClick={() => {
                setSelWeek(w)
                setWords([])
                setCountUp(0)
              }}
            >
              {weekLabel(w)}
            </button>
          ))}
        </div>

        <div className="miniGarden">
          <canvas ref={canvasRef} className="miniCanvas" />
          <div className="wordsLayer">
            {words.map((w) => (
              <div key={w.id} className="fw" style={{ left: `${w.leftPct}%`, bottom: `${w.bottomPct}%` }}>
                {w.text}
              </div>
            ))}
          </div>
        </div>

        <div className="mlist">
          {total ? (
            [...weekMemories].reverse().map((m, i) => {
              const fd = FLOWERS[m.mood] ?? FLOWERS.moved
              return (
                <div key={m.id} className="mi" style={{ animationDelay: `${i * 45}ms` }}>
                  <div className="miEm">{fd.emoji}</div>
                  <div>
                    <div className="miTx">{m.text}</div>
                    <div className="miDt">
                      {fd.name} · {formatDateTimeShort(m.created_at)}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="emptyWeek">この週はまだ幸せが貯まっていません</div>
          )}
        </div>
      </div>
    </div>
  )
}

function renderMiniFlower(
  ctx: CanvasRenderingContext2D,
  f: MiniFlower,
  nowMs: number,
  W: number,
  H: number,
) {
  const def = FLOWERS[f.mood] ?? FLOWERS.moved
  const elapsed = nowMs - f.bornAtMs
  const p = clamp01(elapsed / 900)
  const grow = easeInOutQuad(p)

  const x = (f.xp * W) / 100
  const groundY = H - 28
  const sc = grow * (0.45 + rand(f.id, 'sc') * 0.38)
  const stemH = (32 + rand(f.id, 'stemH') * 22) * sc
  const r = (11 + rand(f.id, 'r') * 7) * sc

  ctx.save()
  ctx.translate(x, groundY)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -stemH)
  ctx.strokeStyle = '#7cbf8a'
  ctx.lineWidth = 1.3
  ctx.stroke()
  ctx.translate(0, -stemH)

  if (f.isToday) {
    const t = (nowMs % 3000) / 3000
    const pulse = 0.45 + 0.55 * (0.5 - 0.5 * Math.cos(Math.PI * 2 * t))
    const glowR = r * (1.2 + 0.3 * pulse)
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, glowR)
    g.addColorStop(0, `rgba(255,255,255,${0.34 * pulse})`)
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(0, 0, glowR, 0, Math.PI * 2)
    ctx.fill()
  }

  if (def.petals === 0) {
    for (let j = -2; j <= 2; j++) {
      ctx.beginPath()
      ctx.ellipse(j * 2.5 * sc, -5 * sc, 2 * sc, 6 * sc, 0, 0, Math.PI * 2)
      ctx.fillStyle = `hsl(${def.hue},${def.sat}%,${def.light}%)`
      ctx.globalAlpha = 0.82
      ctx.fill()
      ctx.globalAlpha = 1
    }
  } else {
    for (let j = 0; j < def.petals; j++) {
      const a = (j / def.petals) * Math.PI * 2
      const px = Math.cos(a) * r * 0.56
      const py = Math.sin(a) * r * 0.56
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(a + Math.PI / 2)
      ctx.beginPath()
      ctx.ellipse(0, 0, r * 0.42, r * 0.28, 0, 0, Math.PI * 2)
      ctx.fillStyle = `hsl(${def.hue},${def.sat}%,${def.light}%)`
      ctx.globalAlpha = 0.85
      ctx.fill()
      ctx.restore()
    }
    ctx.beginPath()
    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2)
    ctx.fillStyle = '#fff8e1'
    ctx.fill()
  }

  ctx.restore()
}
