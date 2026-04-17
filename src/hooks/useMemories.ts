import { useCallback, useEffect, useMemo, useState } from 'react'
import { getDeviceId } from '../lib/device'
import { getSupabase } from '../lib/supabase'
import { weekKey } from '../lib/time'
import type { Memory, Mood } from '../types'

const LS_KEY = 'hanabin_memories_v1'

function safeParseMemories(raw: string | null): Memory[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw) as unknown
    if (!Array.isArray(v)) return []
    return v.filter(Boolean) as Memory[]
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

      const mems = (data || []).map((m) => ({
        id: String(m.id),
        user_id: m.user_id ? String(m.user_id) : null,
        text: String(m.text ?? ''),
        mood: m.mood as Mood,
        xp: Number(m.xp ?? 50),
        created_at: String(m.created_at),
        week_key: String(m.week_key ?? weekKey(new Date(m.created_at))),
      })) as Memory[]

      setMemories(mems)
      localStorage.setItem(LS_KEY, JSON.stringify(mems))
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const weeks = useMemo(() => {
    const w = [...new Set(memories.map((m) => m.week_key))].sort((a, b) => (b > a ? 1 : -1))
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
