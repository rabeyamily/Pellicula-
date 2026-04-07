import React from 'react'

export const FILTERS = [
  {
    id: 'none',
    label: 'Natural',
    css: 'none',
    preview: 'brightness(1)',
  },
  {
    id: 'sepia',
    label: 'Daguerréotype',
    css: 'sepia(0.9) contrast(1.1) brightness(0.95)',
    preview: 'sepia(0.9) contrast(1.1)',
  },
  {
    id: 'noir',
    label: 'Film Noir',
    css: 'grayscale(1) contrast(1.4) brightness(0.85)',
    preview: 'grayscale(1) contrast(1.4)',
  },
  {
    id: 'faded',
    label: 'Faded',
    css: 'sepia(0.3) saturate(0.7) contrast(0.9) brightness(1.1)',
    preview: 'sepia(0.3) saturate(0.7)',
  },
  {
    id: 'warm',
    label: 'Kodachrome',
    css: 'saturate(1.4) contrast(1.1) hue-rotate(-10deg) brightness(1.05)',
    preview: 'saturate(1.4) hue-rotate(-10deg)',
  },
  {
    id: 'cold',
    label: 'Cyanotype',
    css: 'grayscale(0.4) hue-rotate(180deg) saturate(0.6) brightness(0.9) contrast(1.1)',
    preview: 'grayscale(0.4) hue-rotate(180deg)',
  },
  {
    id: 'lomo',
    label: 'Lomography',
    css: 'saturate(1.8) contrast(1.3) brightness(0.9) hue-rotate(5deg)',
    preview: 'saturate(1.8) contrast(1.3)',
  },
  {
    id: 'bleach',
    label: 'Bleach',
    css: 'contrast(1.2) brightness(1.15) saturate(0.5)',
    preview: 'contrast(1.2) saturate(0.5)',
  },
]

export default function FilterSelector({ selected, onChange, videoRef }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 px-1">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f)}
          className={`flex-shrink-0 flex flex-col items-center gap-1.5 group btn-press`}
        >
          {/* Mini preview swatch */}
          <div
            className={`w-14 h-14 rounded-sm overflow-hidden border-2 transition-all duration-200 ${
              selected.id === f.id
                ? 'border-film-amber shadow-[0_0_10px_rgba(200,134,42,0.5)]'
                : 'border-film-brown hover:border-film-silver'
            }`}
          >
            <div
              className="w-full h-full bg-gradient-to-br from-amber-200 via-orange-100 to-yellow-300"
              style={{ filter: f.preview }}
            />
          </div>
          <span
            className={`font-mono text-[10px] tracking-wider uppercase transition-colors ${
              selected.id === f.id ? 'text-film-amber' : 'text-film-silver'
            }`}
          >
            {f.label}
          </span>
        </button>
      ))}
    </div>
  )
}
