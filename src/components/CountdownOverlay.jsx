import React, { useEffect, useState } from 'react'

export default function CountdownOverlay({ from = 3, onDone }) {
  const [count, setCount] = useState(from)
  const [key, setKey] = useState(0)

  useEffect(() => {
    if (count <= 0) {
      onDone()
      return
    }
    const t = setTimeout(() => {
      setCount(c => c - 1)
      setKey(k => k + 1)
    }, 1000)
    return () => clearTimeout(t)
  }, [count, onDone])

  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/30 pointer-events-none">
      {count > 0 && (
        <span
          key={key}
          className="count-num font-display text-[120px] font-bold text-film-cream drop-shadow-[0_4px_20px_rgba(200,134,42,0.8)]"
          style={{ textShadow: '0 0 40px rgba(200,134,42,0.6), 0 2px 8px rgba(0,0,0,0.8)' }}
        >
          {count}
        </span>
      )}
    </div>
  )
}
