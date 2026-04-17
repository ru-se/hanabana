import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDeviceId } from '../lib/device'
import { FLOWERS } from '../lib/flowerGen'
import { getSupabase } from '../lib/supabase'
import { weekKey } from '../lib/time'
import type { Memory, Mood } from '../types'

const LS_KEY = 'hanabin_memories_v1'

function coerceMood(m: unknown): Mood {
  return typeof m === 'string' && m in FLOWERS ? (m as Mood) : 'moved'
}

function normalizeMemory(m: Memory): Memory {
  const created = m.created_at ? String(m.created_at) : new Date().toISOString()
  return {
    id: String(m.id),
    user_id: m.user_id != null ? String(m.user_id) : null,
    text: String(m.text ?? ''),
    mood: coerceMood(m.mood),
    xp: Number.isFinite(Number(m.xp)) ? Number(m.xp) : 50,
    created_at: created,
    week_key: weekKey(new Date(created)),
  }
}

function safeParseMemories(raw: string | null): Memory[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw) as unknown
    if (!Array.isArray(v)) return []
    return v.filter(Boolean).map((row) => normalizeMemory(row as Memory))
  } catch {
    return []
  }
}

export function useMemories(): {
  memories: Memory[]
  weeks: string[]
  addMemory: (args: { text: string; mood: Mood; xp: number; createdAtISO?: string }) => Promise<Memory>
} {
  const [memories, setMemories] = useState<Memory[]>(() => safeParseMemories(localStorage.getItem(LS_KEY)))

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) return

    let cancelled = false
    const deviceId = getDeviceId()

    ;(async () => {
      const { data, error } = await sb
        .from('memories')
        .select('id,user_id,text,mood,xp,created_at,week_key')
        .eq('user_id', deviceId)
        .order('created_at', { ascending: true })
        .limit(500)

      if (cancelled) return
      if (error) {
        // fall back to local storage state
        return
      }

      const mems = (data || []).map((m) =>
        normalizeMemory({
          id: String(m.id),
          user_id: m.user_id ? String(m.user_id) : null,
          text: String(m.text ?? ''),
          mood: m.mood as Mood,
          xp: Number(m.xp ?? 50),
          created_at: String(m.created_at),
          week_key: weekKey(new Date(m.created_at)),
        }),
      )

      setMemories(mems)
      localStorage.setItem(LS_KEY, JSON.stringify(mems))
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const weeks = useMemo(() => {
    const w = [...new Set(memories.map((m) => m.week_key))].sort((a, b) => b.localeCompare(a))
    return w.length ? w.slice(0, 8) : [weekKey(new Date())]
  }, [memories])

  const addMemory = useCallback(
    async (args: { text: string; mood: Mood; xp: number; createdAtISO?: string }): Promise<Memory> => {
      const deviceId = getDeviceId()
      const created = args.createdAtISO ?? new Date().toISOString()
      const mem: Memory = {
        id: crypto.randomUUID(),
        user_id: deviceId,
        text: args.text,
        mood: args.mood,
        xp: args.xp,
        created_at: created,
        week_key: weekKey(new Date(created)),
      }

      setMemories((prev) => {
        const next = [...prev, mem].slice(-500)
        localStorage.setItem(LS_KEY, JSON.stringify(next))
        return next
      })

      const sb = getSupabase()
      if (sb) {
        await sb.from('memories').insert({
          id: mem.id,
          user_id: mem.user_id,
          text: mem.text,
          mood: mem.mood,
          xp: mem.xp,
          created_at: mem.created_at,
          week_key: mem.week_key,
        })
      }

      return mem
    },
    [],
  )

  return { memories, weeks, addMemory }
}
