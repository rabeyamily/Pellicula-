import React, { useRef, useEffect, useState, useCallback } from 'react'
import { X, Download, Film } from 'lucide-react'
import StripPreviewModal from './StripPreviewModal'
import { drawImageWithFilter } from '../utils/canvasFilters'

const STRIP_THEMES = [
  { id: 'classic', label: 'Classic', bg: '#faf4e1', text: '#8b6914cc', accent: '#c8862a' },
  { id: 'black', label: 'Black', bg: '#171311', text: '#d8c6a0', accent: '#c8862a' },
  { id: 'brown', label: 'Brown', bg: '#2f2116', text: '#e2c89f', accent: '#c8862a' },
  { id: 'rose', label: 'Rose', bg: '#f8e8e7', text: '#8c4c5b', accent: '#b85d74' },
  { id: 'mint', label: 'Mint', bg: '#e7f4ee', text: '#456b5d', accent: '#4a9277' },
  { id: 'sky', label: 'Sky', bg: '#e8f0fb', text: '#496286', accent: '#527cb9' },
  { id: 'lavender', label: 'Lavender', bg: '#eee9fb', text: '#5f558f', accent: '#7a68be' },
]

export default function DownloadModal({ photos, onClose }) {
  const stripCanvasRef = useRef(null)
  const [isRenderingStrip, setIsRenderingStrip] = useState(false)
  const [showStripPreview, setShowStripPreview] = useState(false)
  const [stripTheme, setStripTheme] = useState(STRIP_THEMES[0])
  const [customFooterLine, setCustomFooterLine] = useState('')

  const PHOTO_W = 300
  const PHOTO_H = 240
  const PADDING = 16
  const FRAME_GAP = 3
  const FRAME_PADDING = 10
  const FRAME_BOTTOM = 10
  const FRAME_W = PHOTO_W + FRAME_PADDING * 2
  const FRAME_H = PHOTO_H + FRAME_PADDING + FRAME_BOTTOM
  const FOOTER_H = 70
  const STRIP_W = FRAME_W

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
    const STRIP_H = count * FRAME_H + Math.max(0, count - 1) * FRAME_GAP + FOOTER_H
    canvas.width = STRIP_W
    canvas.height = STRIP_H
    const ctx = canvas.getContext('2d')
    setIsRenderingStrip(true)

    // Continuous strip background (no dark panel)
    ctx.fillStyle = stripTheme.bg
    ctx.fillRect(0, 0, STRIP_W, STRIP_H)

    // Photos
    const loadAndDraw = async () => {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const img = new Image()
        img.src = photo.dataUrl
        await new Promise(res => { img.onload = res })

        const frameY = i * (FRAME_H + FRAME_GAP)
        const x = FRAME_PADDING
        const y = frameY + FRAME_PADDING

        // Photo with filter
        drawImageWithFilter({
          ctx,
          img,
          x,
          y,
          width: PHOTO_W,
          height: PHOTO_H,
          filterCss: photo.filter?.css,
          filterId: photo.filter?.id,
          drawImageCover,
        })
        drawScanlines(ctx, x, y, PHOTO_W, PHOTO_H)

        // Date stamp
        const now = new Date()
        const stamp = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`
        ctx.fillStyle = `${stripTheme.accent}80`
        ctx.font = 'italic 10px Georgia'
        ctx.textAlign = 'right'
        ctx.fillText(stamp, x + PHOTO_W - 4, y + PHOTO_H - 4)
      }

      const lastShot = photos[photos.length - 1]
      const lastShotDate = lastShot?.takenAt ? new Date(lastShot.takenAt) : new Date()
      const datePart = `${lastShotDate.getFullYear()}.${String(lastShotDate.getMonth() + 1).padStart(2, '0')}.${String(lastShotDate.getDate()).padStart(2, '0')}`
      const timePart = lastShotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      const footerTop = STRIP_H - FOOTER_H

      // Bottom label
      ctx.fillStyle = stripTheme.text
      ctx.font = '10px "Courier New"'
      ctx.textAlign = 'center'
      ctx.fillText('PELLICULA — 35mm — ISO 400', STRIP_W / 2, footerTop + 18)
      ctx.fillStyle = stripTheme.accent
      ctx.font = 'bold 12px "Courier New"'
      ctx.fillText(`${datePart}  ${timePart}`, STRIP_W / 2, footerTop + 38)
      if (customFooterLine.trim()) {
        ctx.fillStyle = stripTheme.text
        ctx.font = '11px "Courier New"'
        ctx.fillText(customFooterLine.trim(), STRIP_W / 2, footerTop + 58)
      }
      setIsRenderingStrip(false)
    }

    loadAndDraw().catch(() => setIsRenderingStrip(false))
  }, [photos, stripTheme, customFooterLine, drawScanlines, drawImageCover])

  const downloadStrip = () => {
    if (isRenderingStrip) return
    const canvas = stripCanvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'pellicula photostrip.png'
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

      drawImageWithFilter({
        ctx,
        img,
        x: pad,
        y: pad,
        width: PHOTO_W,
        height: PHOTO_H,
        filterCss: photo.filter?.css,
        filterId: photo.filter?.id,
        drawImageCover,
      })
      drawScanlines(ctx, pad, pad, PHOTO_W, PHOTO_H)

      ctx.fillStyle = '#8b6914'
      ctx.font = '11px "Courier New"'
      ctx.textAlign = 'center'
      ctx.fillText(String(idx + 1).padStart(2, '0'), canvas.width / 2, canvas.height - 9)

      const link = document.createElement('a')
      link.download = 'pellicula photostrip.png'
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
            <div className="flex items-center gap-2 mb-3">
              {STRIP_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setStripTheme(theme)}
                  className="w-6 h-6 rounded-full btn-press"
                  title={theme.label}
                  style={{
                    background: theme.bg,
                    border: stripTheme.id === theme.id ? '2px solid #c8862a' : '1px solid #3a2d1e',
                    boxShadow: stripTheme.id === theme.id ? '0 0 10px rgba(200,134,42,0.55)' : 'none',
                  }}
                />
              ))}
            </div>
            <input
              type="text"
              value={customFooterLine}
              onChange={(e) => setCustomFooterLine(e.target.value.slice(0, 38))}
              placeholder="Optional line on strip (e.g. Best day ever)"
              className="w-full mb-3 px-3 py-2 rounded-sm font-mono text-[11px] tracking-wider"
              style={{
                background: '#0d0b09',
                border: '1px solid #3a2d1e',
                color: '#f0e6c8',
              }}
            />
            <button
              type="button"
              className="w-full btn-press"
              style={{ outline: 'none' }}
              onClick={() => setShowStripPreview(true)}
              disabled={isRenderingStrip}
              title="Preview strip"
            >
              <canvas
                ref={stripCanvasRef}
                className="w-full rounded"
                style={{ maxHeight: 200, objectFit: 'contain', cursor: isRenderingStrip ? 'default' : 'pointer' }}
              />
            </button>
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

      {/* Strip preview modal */}
      {showStripPreview && (
        <StripPreviewModal
          photos={photos}
          stripTheme={stripTheme}
          customFooterLine={customFooterLine}
          onClose={() => setShowStripPreview(false)}
        />
      )}
    </div>
  )
}
