export type Mood = 'happy' | 'love' | 'moved' | 'calm' | 'tired' | 'fun'

export type FlowerDef = {
  mood: Mood
  name: string
  emoji: string
  hue: number
  petals: number
  sat: number
  light: number
}

export type MoodDetectResult = {
  mood: Mood
  confidence: number
}

export type Memory = {
  id: string
  user_id?: string | null
  device_id?: string | null
  text: string
  mood: Mood
  xp: number
  created_at: string // ISO
  week_key: string
}

export type GardenFlower = {
  id: string
  mood: Mood
  xp: number
  ySeed: number // 0..1 depth-ish seed (deterministic)
  bornAtMs: number
  createdAtISO: string
  isToday: boolean
}
