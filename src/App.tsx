import { useMemo, useRef, useState } from 'react'
import { Garden } from './components/Garden'
import { ParticleCanvas, type ParticleCanvasHandle } from './components/ParticleCanvas'
import { RecapPanel } from './components/RecapPanel'
import { RippleCanvas, type RippleCanvasHandle } from './components/RippleCanvas'
import { Toast, type ToastHandle } from './components/Toast'
import { WriteZone } from './components/WriteZone'
import { useBloom } from './hooks/useBloom'
import { useGarden } from './hooks/useGarden'
import { useMemories } from './hooks/useMemories'

export default function App() {
  const toastRef = useRef<ToastHandle>(null)
  const rippleRef = useRef<RippleCanvasHandle>(null)
  const particleRef = useRef<ParticleCanvasHandle>(null)

  const { memories, addMemory, weeks } = useMemories()
  const garden = useGarden(memories)
  const [recapOpen, setRecapOpen] = useState(false)
  const todayKey = useMemo(() => new Date().toDateString(), [])

  const bloom = useBloom({
    addMemory,
    onFlash: garden.flash,
    onRipple: (x, y) => rippleRef.current?.trigger(x, y),
    onParticles: (x, y, mood) => particleRef.current?.spawn(x, y, mood),
    onBloom: (m) => garden.bloomFromMemory(m),
    onToast: (msg) => toastRef.current?.show(msg),
  })

  return (
    <>
      <Garden flowers={garden.flowers} />
      <RippleCanvas ref={rippleRef} />
      <ParticleCanvas ref={particleRef} />
      <div className="ground" />
      <div className={`flash ${garden.isFlashOn ? 'flashOn' : ''}`} />

      <div className="header">
        <div className="logo">はなびん</div>
      </div>

      <WriteZone disabled={bloom.isBusy} onSubmit={bloom.submit} />

      <div className="counter">
        🌸 <span>{memories.length}</span>
      </div>
      <button className="recapBtn" onClick={() => setRecapOpen(true)}>
        振り返る ✦
      </button>

      <Toast ref={toastRef} />

      {recapOpen && (
        <RecapPanel
          open={recapOpen}
          onClose={() => setRecapOpen(false)}
          weeks={weeks}
          memories={memories}
          todayKey={todayKey}
        />
      )}
    </>
  )
}
