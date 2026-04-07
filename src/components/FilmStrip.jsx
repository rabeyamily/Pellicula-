import React, { useEffect, useRef } from 'react'

function SprocketHoles({ count = 6 }) {
  return (
    <div className="flex flex-col items-center justify-around py-2 gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="sprocket-hole" />
      ))}
    </div>
  )
}

const TILTS = ['tilt-1', 'tilt-2', 'tilt-3', 'tilt-4']

export default function FilmStrip({ photos, onSelect, selectedIdx }) {
  const photoRefs = useRef([])

  useEffect(() => {
    if (selectedIdx === null) return
    const selectedEl = photoRefs.current[selectedIdx]
    if (!selectedEl) return

    selectedEl.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [selectedIdx, photos.length])

  if (photos.length === 0) return null

  return (
    <div className="flex flex-col gap-0">
      {/* Strip header */}
      <div
        className="flex items-center gap-0 rounded-t overflow-hidden"
        style={{ background: '#1a1108', borderBottom: '2px solid #2a1f14' }}
      >
        <SprocketHoles count={photos.length + 1} />
        <div className="flex-1 flex justify-center gap-2 p-2 overflow-x-auto">
          {photos.map((photo, i) => (
            <button
              key={i}
              ref={(el) => {
                photoRefs.current[i] = el
              }}
              onClick={() => onSelect(i)}
              className={`relative flex-shrink-0 transition-all duration-200 btn-press ${TILTS[i % 4]} hover:rotate-0 hover:scale-105`}
              style={{
                width: 90,
                filter: selectedIdx === i ? 'drop-shadow(0 0 8px rgba(200,134,42,0.8))' : 'none',
              }}
            >
              {/* Polaroid frame */}
              <div
                className="bg-film-ivory p-1.5 pb-6"
                style={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  border: selectedIdx === i ? '2px solid #c8862a' : '2px solid transparent',
                }}
              >
                <img
                  src={photo.dataUrl}
                  alt={`Shot ${i + 1}`}
                  className="w-full object-cover"
                  style={{ height: 70, filter: photo.filter?.css || 'none' }}
                />
                {/* Frame number */}
                <div className="absolute bottom-1.5 left-0 right-0 text-center">
                  <span className="font-mono text-[8px] text-film-sepia tracking-widest">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
        <SprocketHoles count={photos.length + 1} />
      </div>

      {/* Film edge label */}
      <div
        className="text-center py-0.5"
        style={{ background: '#0d0b09', borderTop: '1px solid #1a1108' }}
      >
        <span className="font-mono text-[9px] tracking-[0.4em] text-film-sepia/60 uppercase">
          Pellicula — 35mm — ISO 400
        </span>
      </div>
    </div>
  )
}
