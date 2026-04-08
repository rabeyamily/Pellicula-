import React, { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'

export default function StripPreviewModal({
  photos,
  onClose,
  stripTheme = { bg: '#faf4e1', text: '#8b6914cc', accent: '#c8862a' },
  customFooterLine = '',
}) {
  const [stripDataUrl, setStripDataUrl] = useState('')

  const PHOTO_W = 300
  const PHOTO_H = 240
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
      sWidth = srcH * destRatio
      sx = (srcW - sWidth) / 2
    } else if (srcRatio < destRatio) {
      sHeight = srcW / destRatio
      sy = (srcH - sHeight) / 2
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
  }, [])

  useEffect(() => {
    if (!photos?.length) {
      setStripDataUrl('')
      return
    }

    let cancelled = false

    const renderStrip = async () => {
      const canvas = document.createElement('canvas')
      const count = photos.length
      const stripH = count * FRAME_H + Math.max(0, count - 1) * FRAME_GAP + FOOTER_H
      canvas.width = STRIP_W
      canvas.height = stripH
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = stripTheme.bg
      ctx.fillRect(0, 0, STRIP_W, stripH)

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        const img = new Image()
        img.src = photo.dataUrl
        await new Promise((resolve) => {
          img.onload = resolve
        })

        const frameY = i * (FRAME_H + FRAME_GAP)
        const x = FRAME_PADDING
        const y = frameY + FRAME_PADDING

        if (photo.filter && photo.filter.css !== 'none') {
          ctx.filter = photo.filter.css
        }
        drawImageCover(ctx, img, x, y, PHOTO_W, PHOTO_H)
        ctx.filter = 'none'
        drawScanlines(ctx, x, y, PHOTO_W, PHOTO_H)

        const now = new Date()
        const stamp = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`
        ctx.fillStyle = `${stripTheme.accent}80`
        ctx.font = 'italic 10px Georgia'
        ctx.textAlign = 'right'
        ctx.fillText(stamp, x + PHOTO_W - 4, y + PHOTO_H - 4)
      }

      const lastShot = photos[photos.length - 1]
      const lastShotDate = lastShot?.takenAt ? new Date(lastShot.takenAt) : new Date()
      const datePart = `${lastShotDate.getFullYear()}.${String(lastShotDate.getMonth() + 1).padStart(2, '0')}.${String(lastShotDate.getDate()).padStart(2, '0')}`
      const timePart = lastShotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

      const footerTop = stripH - FOOTER_H
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

      if (!cancelled) {
        setStripDataUrl(canvas.toDataURL('image/png'))
      }
    }

    renderStrip()
    return () => {
      cancelled = true
    }
  }, [photos, stripTheme, customFooterLine, drawImageCover, drawScanlines])

  if (!photos?.length) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-20 p-2 rounded-full btn-press"
          style={{ background: 'rgba(13,11,9,0.85)', border: '1px solid #3a2d1e' }}
          title="Close"
        >
          <X size={18} className="text-film-silver" />
        </button>

        {/* Dropping print */}
        <div
          className="strip-drop"
          style={{
            maxHeight: '86vh',
            maxWidth: '92vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {stripDataUrl ? (
            <img
              src={stripDataUrl}
              alt="Strip preview"
              style={{
                maxHeight: '86vh',
                maxWidth: '92vw',
                width: 'auto',
                height: 'auto',
                display: 'block',
                boxShadow: '0 18px 60px rgba(0,0,0,0.55), 0 6px 16px rgba(0,0,0,0.35)',
              }}
            />
          ) : (
            <div
              className="font-mono text-xs tracking-widest uppercase"
              style={{ color: '#c8862a' }}
            >
              Rendering strip...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

