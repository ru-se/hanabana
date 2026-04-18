import type { Memory } from '../types'
import { FLOWERS } from './flowerGen'

// OGP ratio
const W = 1200
const H = 630

export async function generateShareCard(
  weekMemories: Memory[],
  weekLabelText: string,
  moodSummaryText: string,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas context unavailable')

  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#dceeff')
  bg.addColorStop(0.55, '#eef6ff')
  bg.addColorStop(1, '#d4edda')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = '#c8e6c9'
  ctx.fillRect(0, H - 80, W, 80)

  drawFlowers(ctx, weekMemories, W, H)

  ctx.fillStyle = 'rgba(44, 62, 53, 0.85)'
  ctx.font = '500 28px "Zen Kaku Gothic New", sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('はなびん', W - 48, 60)

  ctx.font = '300 22px "Zen Kaku Gothic New", sans-serif'
  ctx.fillStyle = 'rgba(44, 62, 53, 0.65)'
  ctx.fillText(weekLabelText, W - 48, 100)

  ctx.font = '300 20px "Zen Kaku Gothic New", sans-serif'
  ctx.fillStyle = 'rgba(44, 62, 53, 0.72)'
  ctx.textAlign = 'left'
  ctx.fillText(`${weekMemories.length}個の幸せを貯めました`, 48, H - 120)

  ctx.font = '300 17px "Zen Kaku Gothic New", sans-serif'
  ctx.fillStyle = 'rgba(44, 62, 53, 0.55)'
  ctx.fillText(moodSummaryText, 48, H - 88)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('toBlob failed'))
    }, 'image/png')
  })
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function downloadBlob(blob: Blob, filename = 'hanabin.png') {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 3000)
}

function drawFlowers(
  ctx: CanvasRenderingContext2D,
  memories: Memory[],
  width: number,
  height: number,
) {
  const groundY = height - 80
  const count = memories.length
  if (!count) return

  memories.forEach((m, i) => {
    const def = FLOWERS[m.mood] ?? FLOWERS.moved
    const xp = m.xp ?? (8 + (i / Math.max(count - 1, 1)) * 84)
    const x = (xp / 100) * width
    const sc = 0.55 + Math.random() * 0.5
    const stemH = (60 + Math.random() * 40) * sc
    const r = (18 + Math.random() * 10) * sc

    ctx.save()
    ctx.translate(x, groundY)

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -stemH)
    ctx.strokeStyle = '#7cbf8a'
    ctx.lineWidth = 2 * sc
    ctx.stroke()

    ctx.translate(0, -stemH)

    if (def.petals === 0) {
      for (let j = -2; j <= 2; j++) {
        ctx.beginPath()
        ctx.ellipse(j * 3 * sc, -5 * sc, 2.5 * sc, 7 * sc, 0, 0, Math.PI * 2)
        ctx.fillStyle = `hsl(${def.hue},${def.sat}%,${def.light}%)`
        ctx.globalAlpha = 0.85
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
        ctx.globalAlpha = 0.87
        ctx.fill()
        ctx.restore()
      }
      ctx.beginPath()
      ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2)
      ctx.fillStyle = '#fff8e1'
      ctx.fill()
    }

    ctx.restore()
  })
}
