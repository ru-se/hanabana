import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import Anthropic from '@anthropic-ai/sdk'

type Mood = 'happy' | 'love' | 'moved' | 'calm' | 'tired' | 'fun'

const MOODS: Mood[] = ['happy', 'love', 'moved', 'calm', 'tired', 'fun']

const PROMPT = `
あなたは日記の感情を分析するアシスタントです。
以下の日記のテキストを読み、最も近い感情を1つだけ返してください。

感情の選択肢:
- happy: うれしい、たのしい、達成感
- love: しあわせ、愛情、温かい気持ち
- moved: 感動、きれい、じーんとした
- calm: 穏やか、ほっとした、おいしかった
- tired: 疲れた、しんどい（でも頑張った）
- fun: わくわく、興奮、楽しみ

日記:
{{text}}

以下のJSON形式のみで返してください。説明は不要です:
{"mood":"happy","confidence":0.9}
`.trim()

const KW: Array<{ words: string[]; mood: Exclude<Mood, 'fun'> }> = [
  { words: ['うれし', 'たのし', 'やった', '最高', 'ありがと', '褒め', 'ほめ', '笑', 'わら'], mood: 'happy' },
  { words: ['しあわせ', '幸せ', '幸福', '嬉し', '好き', '愛', 'すき'], mood: 'love' },
  { words: ['きれい', '綺麗', '美し', '夕焼け', '空', '花', '虹', '星', '月'], mood: 'moved' },
  { words: ['平和', '穏', '落ち着', 'ゆっくり', 'のんびり', '静か', 'おいし', '美味'], mood: 'calm' },
  { words: ['疲れ', 'つかれ', 'しんど', '大変', 'でも', 'けど'], mood: 'tired' },
]

function heuristicMood(text: string): { mood: Mood; confidence: number } {
  const scores: Record<string, number> = {}
  for (const { words, mood } of KW) {
    for (const w of words) {
      if (text.includes(w)) scores[mood] = (scores[mood] || 0) + 1
    }
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  if (best && MOODS.includes(best[0] as Mood)) {
    const c = Math.min(0.9, 0.55 + best[1] * 0.1)
    return { mood: best[0] as Mood, confidence: c }
  }
  const fallback: Mood[] = ['moved', 'love', 'happy', 'fun', 'calm', 'tired']
  return { mood: fallback[Math.floor(Math.random() * 3)], confidence: 0.52 }
}

function extractFirstJsonObject(s: string): unknown | null {
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  const cut = s.slice(start, end + 1)
  try {
    return JSON.parse(cut)
  } catch {
    return null
  }
}

async function claudeMood(text: string): Promise<{ mood: Mood; confidence: number } | null> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return null

  const client = new Anthropic({ apiKey: key })
  const userPrompt = PROMPT.replace('{{text}}', text)

  const msg = await client.messages.create({
    model: process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-latest',
    max_tokens: 120,
    temperature: 0,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const joined = msg.content
    .map((c) => (c.type === 'text' ? c.text : ''))
    .join('\n')
    .trim()

  const parsed = extractFirstJsonObject(joined)
  if (!parsed || typeof parsed !== 'object') return null
  const obj = parsed as Record<string, unknown>
  const mood = typeof obj.mood === 'string' ? obj.mood : undefined
  const confidence = typeof obj.confidence === 'number' ? obj.confidence : undefined
  if (!mood || !MOODS.includes(mood as Mood)) return null
  const conf = typeof confidence === 'number' && Number.isFinite(confidence) ? confidence : 0.7
  return { mood: mood as Mood, confidence: Math.max(0, Math.min(1, conf)) }
}

const app = express()
app.use(express.json({ limit: '32kb' }))

app.post('/api/detect-mood', async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text : ''
  if (text.trim().length < 1) return res.status(400).json({ error: 'text is required' })

  try {
    const fromClaude = await claudeMood(text)
    if (fromClaude) return res.json(fromClaude)
    return res.json(heuristicMood(text))
  } catch {
    return res.json(heuristicMood(text))
  }
})

// production: serve built client
if (process.env.NODE_ENV === 'production') {
  const dist = path.resolve(process.cwd(), 'dist')
  if (fs.existsSync(dist)) {
    app.use(express.static(dist))
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
  }
}

const port = Number(process.env.PORT || 5174)
app.listen(port, () => {
  console.log(`[hanabin] api listening on http://localhost:${port}`)
})

