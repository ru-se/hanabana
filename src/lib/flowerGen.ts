import type { FlowerDef, Mood } from '../types'

export const FLOWERS: Record<Mood, Omit<FlowerDef, 'mood'>> = {
  happy: { name: 'ひまわり', emoji: '🌻', hue: 45, sat: 88, light: 64, petals: 8 },
  love: { name: '桜', emoji: '🌸', hue: 340, sat: 65, light: 80, petals: 5 },
  moved: { name: 'ネモフィラ', emoji: '💙', hue: 208, sat: 72, light: 70, petals: 5 },
  calm: { name: 'ラベンダー', emoji: '💜', hue: 268, sat: 52, light: 72, petals: 0 },
  tired: { name: 'スズラン', emoji: '🌿', hue: 135, sat: 42, light: 66, petals: 0 },
  fun: { name: 'チューリップ', emoji: '🌷', hue: 5, sat: 78, light: 72, petals: 6 },
}

export function flowerDef(mood: Mood): FlowerDef {
  return { mood, ...FLOWERS[mood] }
}

export function flowerToastText(mood: Mood): string {
  const f = FLOWERS[mood]
  return `${f.emoji} ${f.name}が咲きました`
}

/** 送信直後の一行フィードバック（審査・デモで「意味」が伝わりやすい） */
export function moodSubline(mood: Mood): string {
  const sub: Record<Mood, string> = {
    happy: '今日は、少しだけ軽やかな風が吹いてる。',
    love: '今日は、やわらかな温かさに包まれているみたい。',
    moved: '今日は、胸のあたりが静かにふわっとする。',
    calm: '今日は、呼吸がゆっくりになる時間があった。',
    tired: '今日は、がんばりをそっと抱きしめてあげたい。',
    fun: '今日は、小さなわくわくが顔を出した。',
  }
  return sub[mood] ?? sub.moved
}
