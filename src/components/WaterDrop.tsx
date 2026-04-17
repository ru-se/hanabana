export function WaterDrop(props: { className?: string }) {
  return (
    <svg className={props.className} width="60" height="60" viewBox="0 0 60 60" fill="none">
      <circle cx="30" cy="30" r="29" stroke="rgba(107,168,212,.25)" strokeWidth="1" />
      <circle cx="30" cy="30" r="21" fill="rgba(107,168,212,.07)" />
      <path
        d="M30 15C30 15 21 25.5 21 33C21 37.97 25.03 42 30 42C34.97 42 39 37.97 39 33C39 25.5 30 15 30 15Z"
        fill="rgba(107,168,212,.8)"
      />
      <ellipse
        cx="26.5"
        cy="29.5"
        rx="2.8"
        ry="4.2"
        fill="rgba(255,255,255,.38)"
        transform="rotate(-18 26.5 29.5)"
      />
    </svg>
  )
}
