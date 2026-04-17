import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

export type ToastHandle = {
  show: (text: string) => void
}

export const Toast = forwardRef<ToastHandle>(function Toast(_props, ref) {
  const [text, setText] = useState('')
  const [show, setShow] = useState(false)
  const tRef = useRef<number | null>(null)

  useImperativeHandle(ref, () => ({
    show: (t: string) => {
      setText(t)
      setShow(true)
      if (tRef.current) window.clearTimeout(tRef.current)
      tRef.current = window.setTimeout(() => setShow(false), 2300)
    },
  }))

  return <div className={`toast ${show ? 'toastShow' : ''}`}>{text}</div>
})
