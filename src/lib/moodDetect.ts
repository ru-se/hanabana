import type { MoodDetectResult } from '../types'

export async function detectMood(text: string): Promise<MoodDetectResult> {
  const res = await fetch('/api/detect-mood', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`detect-mood failed: ${res.status} ${msg}`)
  }

  const data = (await res.json()) as MoodDetectResult
  return data
}
