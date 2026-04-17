import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { WaterDrop } from './WaterDrop'

export function WriteZone(props: {
  disabled?: boolean
  busy?: boolean
  feedbackLine?: string | null
  onSubmit: (text: string) => Promise<void>
}) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const busy = props.busy ?? false
  const canSend = useMemo(() => text.trim().length >= 2 && !props.disabled, [props.disabled, text])
  const hasAny = useMemo(() => text.trim().length >= 1, [text])

  const submit = useCallback(async () => {
    const t = text.trim()
    if (t.length < 2 || props.disabled) return
    setText('')
    await props.onSubmit(t)
    textareaRef.current?.focus()
  }, [props, text])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        void submit()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [submit])

  return (
    <div className="writeZone">
      <div className="placeholderText" style={{ opacity: hasAny ? 0 : 1 }}>
        今日の、ちいさな幸せ。
      </div>
      <textarea
        ref={textareaRef}
        className="memo"
        rows={3}
        spellCheck={false}
        value={text}
        disabled={props.disabled}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="underline" />
      <div className={`hint ${canSend ? 'hintOn' : ''}`}>⌘ Enter でも送れます</div>
      <div className={`analyzeLine ${busy ? 'analyzeLineOn' : ''}`} aria-live="polite">
        気持ちを読み取り中…
      </div>
      {props.feedbackLine ? (
        <div className="writeFeedback" aria-live="polite">
          {props.feedbackLine}
        </div>
      ) : null}
      <button
        className={`sendBtnWrap ${canSend ? 'sendBtnShow' : ''}`}
        onClick={() => void submit()}
        title="花を咲かせる"
        disabled={!canSend}
        aria-label="花を咲かせる"
      >
        <WaterDrop className={`dropBody ${busy ? 'dropSending' : ''}`} />
      </button>
    </div>
  )
}
