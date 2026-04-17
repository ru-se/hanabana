import type { MoodDetectResult } from '../types'

const DETECT_TIMEOUT_MS = 15_000

export async function detectMood(text: string): Promise<MoodDetectResult> {
  const ctrl = new AbortController()
  const tid = window.setTimeout(() => ctrl.abort(), DETECT_TIMEOUT_MS)
  try {
    const res = await fetch('/api/detect-mood', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
      signal: ctrl.signal,
    })

    if (!res.ok) {
      const msg = await res.text().catch(() => '')
      throw new Error(`detect-mood failed: ${res.status} ${msg}`)
    }

    const data = (await res.json()) as MoodDetectResult
    return data
  } finally {
    window.clearTimeout(tid)
  }
}
