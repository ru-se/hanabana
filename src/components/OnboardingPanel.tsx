import { useMemo, useState } from 'react'

type Props = {
  open: boolean
  busy?: boolean
  onSkip: () => void
  onSeed: (entries: string[]) => Promise<void>
}

const SEED_COUNT = 3

export function OnboardingPanel(props: Props) {
  const [values, setValues] = useState<string[]>(['', '', ''])
  const [localBusy, setLocalBusy] = useState(false)
  const busy = !!props.busy || localBusy

  const filled = useMemo(() => values.map((v) => v.trim()).filter((v) => v.length >= 2), [values])
  const canSubmit = filled.length >= SEED_COUNT && !busy

  if (!props.open) return null

  return (
    <div className="onbOverlay" aria-hidden={false}>
      <div className="onbCard" role="dialog" aria-modal="true">
        <h2 className="onbTitle">最初に、最近の小さな幸せを3つ</h2>
        <p className="onbSub">最初から3本の花を咲かせて、あなたの花畑を育て始めよう。</p>

        <div className="onbFields">
          {values.map((v, i) => (
            <textarea
              key={i}
              className="onbInput"
              rows={2}
              maxLength={120}
              placeholder={`例）${exampleByIndex(i)}`}
              value={v}
              disabled={busy}
              onChange={(e) => {
                const next = [...values]
                next[i] = e.target.value
                setValues(next)
              }}
            />
          ))}
        </div>

        <div className="onbActions">
          <button className="onbGhost" disabled={busy} onClick={props.onSkip}>
            あとで書く
          </button>
          <button
            className="onbPrimary"
            disabled={!canSubmit}
            onClick={async () => {
              if (!canSubmit) return
              setLocalBusy(true)
              try {
                await props.onSeed(filled.slice(0, SEED_COUNT))
              } finally {
                setLocalBusy(false)
              }
            }}
          >
            {busy ? '花を咲かせています…' : '3つ咲かせる'}
          </button>
        </div>
      </div>
    </div>
  )
}

function exampleByIndex(i: number): string {
  const examples = ['電車で席を譲ってもらった', '夕焼けがすごくきれいだった', 'コンビニの店員さんが優しかった']
  return examples[i] ?? examples[0]
}

