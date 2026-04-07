import React, { useRef, useEffect, useState, useCallback } from 'react'
import { X, Download, Film } from 'lucide-react'

export default function DownloadModal({ photos, onClose }) {
  const stripCanvasRef = useRef(null)
  const [isRenderingStrip, setIsRenderingStrip] = useState(false)

  const PHOTO_W = 300
  const PHOTO_H = 240
  const PADDING = 16
  const HOLE_W = 24
  const STRIP_W = PHOTO_W + (HOLE_W + PADDING) * 2 + PADDING * 2

  const drawScanlines = useCallback((ctx, x, y, w, h) => {
    ctx.save()
    ctx.globalAlpha = 0.14
    ctx.fillStyle = '#000000'
    for (let row = y; row < y + h; row += 4) {
      ctx.fillRect(x, row, w, 1)
    }
    ctx.restore()
  }, [])

  const drawImageCover = useCallback((ctx, img, dx, dy, dWidth, dHeight) => {
    const srcW = img.naturalWidth || img.width
    const srcH = img.naturalHeight || img.height
    if (!srcW || !srcH) return

    const srcRatio = srcW / srcH
    const destRatio = dWidth / dHeight

    let sx = 0
    let sy = 0
    let sWidth = srcW
    let sHeight = srcH

    if (srcRatio > destRatio) {
      // Source is wider: crop left/right.
      sWidth = srcH * destRatio
      sx = (srcW - sWidth) / 2
    } else if (srcRatio < destRatio) {
      // Source is taller: crop top/bottom.
      sHeight = srcW / destRatio
      sy = (srcH - sHeight) / 2
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  }, [])

  // Draw film strip onto canvas
  useEffect(() => {
    if (!stripCanvasRef.current || photos.length === 0) return
    const canvas = stripCanvasRef.current
    const count = photos.length
    const STRIP_H = count * (PHOTO_H + PADDING) + PADDING * 2
    canvas.width = STRIP_W
    canvas.height = STRIP_H
    const ctx = canvas.getContext('2d')
    setIsRenderingStrip(true)

    // Background
    ctx.fillStyle = '#1a1108'
    ctx.fillRect(0, 0, STRIP_W, STRIP_H)

    // Sprocket holes
    const holeW = 14, holeH = 20, holeR = 3
    const holeX_left = 8
    const holeX_right = STRIP_W - holeW - 8
    for (let row = 0; row < count; row++) {
      const yCenter = PADDING + row * (PHOTO_H + PADDING) + PHOTO_H / 2
      for (const hx of [holeX_left, holeX_right]) {
        ctx.fillStyle = '#0d0b09'
        ctx.strokeStyle = '#3a2d1e'
        ctx.lineWidth = 1.5
        // Rounded rect
        ctx.beginPath()
        ctx.roundRect(hx, yCenter - holeH / 2, holeW, holeH, holeR)
        ctx.fill()
        ctx.stroke()
      }
    }

    // Photos
    const loadAndDraw = async () => {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const img = new Image()
        img.src = photo.dataUrl
        await new Promise(res => { img.onload = res })

        const x = HOLE_W + PADDING * 2
        const y = PADDING + i * (PHOTO_H + PADDING)

        // Polaroid white border
        ctx.fillStyle = '#faf4e1'
        ctx.fillRect(x - 6, y - 6, PHOTO_W + 12, PHOTO_H + 28)

        // Photo with filter
        if (photo.filter && photo.filter.css !== 'none') {
          ctx.filter = photo.filter.css
        }
        drawImageCover(ctx, img, x, y, PHOTO_W, PHOTO_H)
        ctx.filter = 'none'
        drawScanlines(ctx, x, y, PHOTO_W, PHOTO_H)

        // Frame number
        ctx.fillStyle = '#8b6914'
        ctx.font = '11px "Courier New"'
        ctx.textAlign = 'center'
        ctx.fillText(String(i + 1).padStart(2, '0'), x + PHOTO_W / 2, y + PHOTO_H + 18)

        // Date stamp
        const now = new Date()
        const stamp = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`
        ctx.fillStyle = '#c8862a80'
        ctx.font = 'italic 10px Georgia'
        ctx.textAlign = 'right'
        ctx.fillText(stamp, x + PHOTO_W - 4, y + PHOTO_H - 4)
      }

      const lastShot = photos[photos.length - 1]
      const lastShotDate = lastShot?.takenAt ? new Date(lastShot.takenAt) : new Date()
      const datePart = `${lastShotDate.getFullYear()}.${String(lastShotDate.getMonth() + 1).padStart(2, '0')}.${String(lastShotDate.getDate()).padStart(2, '0')}`
      const timePart = lastShotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      // Bottom label
      ctx.fillStyle = '#8b691460'
      ctx.font = '10px "Courier New"'
      ctx.textAlign = 'center'
      ctx.fillText('PELLICULA — 35mm — ISO 400', STRIP_W / 2, STRIP_H - 16)
      ctx.fillStyle = '#c8862a99'
      ctx.font = '11px "Courier New"'
      ctx.fillText(`${datePart}  ${timePart}`, STRIP_W / 2, STRIP_H - 4)
      setIsRenderingStrip(false)
    }

    loadAndDraw().catch(() => setIsRenderingStrip(false))
  }, [photos, drawScanlines, drawImageCover])

  const downloadStrip = () => {
    if (isRenderingStrip) return
    const canvas = stripCanvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `pellicula-strip-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  const downloadSingle = (photo, idx) => {
    const canvas = document.createElement('canvas')
    const pad = 10
    const bottomPad = 28
    canvas.width = PHOTO_W + pad * 2
    canvas.height = PHOTO_H + pad * 2 + bottomPad
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#faf4e1'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (photo.filter && photo.filter.css !== 'none') {
        ctx.filter = photo.filter.css
      }
      drawImageCover(ctx, img, pad, pad, PHOTO_W, PHOTO_H)
      ctx.filter = 'none'
      drawScanlines(ctx, pad, pad, PHOTO_W, PHOTO_H)

      ctx.fillStyle = '#8b6914'
      ctx.font = '11px "Courier New"'
      ctx.textAlign = 'center'
      ctx.fillText(String(idx + 1).padStart(2, '0'), canvas.width / 2, canvas.height - 9)

      const link = document.createElement('a')
      link.download = `pellicula-${String(idx + 1).padStart(2, '0')}-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = photo.dataUrl
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-xl w-full max-h-[90vh] overflow-y-auto rounded-lg"
        style={{ background: '#1a1108', border: '1px solid #3a2d1e' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-film-brown">
          <div className="flex items-center gap-2">
            <Film size={18} className="text-film-amber" />
            <span className="font-display text-film-cream text-lg">Your Roll</span>
          </div>
          <button onClick={onClose} className="text-film-silver hover:text-film-cream btn-press">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4">
          {/* Individual photos */}
          <div>
            <p className="font-mono text-[11px] text-film-silver tracking-widest uppercase mb-3">
              Individual frames
            </p>
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, i) => (
                <div key={i} className="relative group">
                  <div className="bg-film-ivory p-1.5 pb-5" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                    <img
                      src={photo.dataUrl}
                      alt={`Frame ${i + 1}`}
                      className="w-full object-cover"
                      style={{ height: 90, filter: photo.filter?.css || 'none' }}
                    />
                    <div className="absolute bottom-1 left-0 right-0 text-center">
                      <span className="font-mono text-[8px] text-film-sepia">{String(i+1).padStart(2,'0')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadSingle(photo, i)}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity btn-press"
                  >
                    <Download size={20} className="text-film-cream" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Full strip download */}
          <div>
            <p className="font-mono text-[11px] text-film-silver tracking-widest uppercase mb-3">
              Full strip
            </p>
            <canvas
              ref={stripCanvasRef}
              className="w-full rounded"
              style={{ maxHeight: 200, objectFit: 'contain' }}
            />
            <button
              onClick={downloadStrip}
              disabled={isRenderingStrip}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 font-mono text-[13px] tracking-widest uppercase btn-press transition-colors"
              style={{
                background: isRenderingStrip ? '#1f1810' : '#2a1f14',
                border: `1px solid ${isRenderingStrip ? '#6b4f1f' : '#c8862a'}`,
                color: isRenderingStrip ? '#8b6914' : '#c8862a',
              }}
              onMouseEnter={e => {
                if (isRenderingStrip) return
                e.currentTarget.style.background = '#c8862a'
                e.currentTarget.style.color = '#0d0b09'
              }}
              onMouseLeave={e => {
                if (isRenderingStrip) return
                e.currentTarget.style.background = '#2a1f14'
                e.currentTarget.style.color = '#c8862a'
              }}
            >
              <Download size={16} />
              {isRenderingStrip ? 'Rendering strip…' : 'Download Full Strip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
