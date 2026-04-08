let supportsCanvasFilterCache = null

function clamp(value, min = 0, max = 255) {
  return Math.max(min, Math.min(max, value))
}

function adjustContrast(v, amount) {
  return (v - 128) * amount + 128
}

function adjustSaturation(r, g, b, amount) {
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return [
    l + (r - l) * amount,
    l + (g - l) * amount,
    l + (b - l) * amount,
  ]
}

function blend(a, b, t) {
  return a * (1 - t) + b * t
}

export function supportsCanvasFilter() {
  if (supportsCanvasFilterCache !== null) return supportsCanvasFilterCache

  // iOS Safari/WebKit often reports filter support but fails to render
  // consistently for canvas drawImage exports; use fallback there.
  const ua = navigator.userAgent || ''
  const isIOSWebKit = /iPhone|iPad|iPod/i.test(ua) && /AppleWebKit/i.test(ua)
  if (isIOSWebKit) {
    supportsCanvasFilterCache = false
    return supportsCanvasFilterCache
  }

  const c = document.createElement('canvas')
  const ctx = c.getContext('2d')
  if (!ctx) return false

  // Functional test: verify filter affects pixel output, not just assignment.
  c.width = 2
  c.height = 1
  ctx.clearRect(0, 0, 2, 1)
  ctx.filter = 'grayscale(1)'
  ctx.fillStyle = 'rgb(255,0,0)'
  ctx.fillRect(0, 0, 1, 1)
  const p = ctx.getImageData(0, 0, 1, 1).data
  const looksGray = Math.abs(p[0] - p[1]) < 3 && Math.abs(p[1] - p[2]) < 3
  supportsCanvasFilterCache = ctx.filter === 'grayscale(1)' && looksGray
  return supportsCanvasFilterCache
}

function applyFallbackFilterToRegion(ctx, x, y, w, h, filterId) {
  const imageData = ctx.getImageData(x, y, w, h)
  const d = imageData.data

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i]
    let g = d[i + 1]
    let b = d[i + 2]
    const a = d[i + 3]

    if (a === 0) continue

    switch (filterId) {
      case 'sepia': {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b
        const sg = 0.349 * r + 0.686 * g + 0.168 * b
        const sb = 0.272 * r + 0.534 * g + 0.131 * b
        r = adjustContrast(sr, 1.1) * 0.95
        g = adjustContrast(sg, 1.1) * 0.95
        b = adjustContrast(sb, 1.1) * 0.95
        break
      }
      case 'noir': {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        r = adjustContrast(gray, 1.4) * 0.85
        g = adjustContrast(gray, 1.4) * 0.85
        b = adjustContrast(gray, 1.4) * 0.85
        break
      }
      case 'faded': {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b
        const sg = 0.349 * r + 0.686 * g + 0.168 * b
        const sb = 0.272 * r + 0.534 * g + 0.131 * b
        r = blend(r, sr, 0.3)
        g = blend(g, sg, 0.3)
        b = blend(b, sb, 0.3)
        ;[r, g, b] = adjustSaturation(r, g, b, 0.7)
        r = adjustContrast(r, 0.9) * 1.1
        g = adjustContrast(g, 0.9) * 1.1
        b = adjustContrast(b, 0.9) * 1.1
        break
      }
      case 'warm': {
        ;[r, g, b] = adjustSaturation(r, g, b, 1.4)
        r = adjustContrast(r, 1.1) * 1.08
        g = adjustContrast(g, 1.1) * 1.03
        b = adjustContrast(b, 1.1) * 0.92
        break
      }
      case 'cold': {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b
        r = blend(r, gray * 0.85, 0.4)
        g = blend(g, gray * 0.95, 0.4)
        b = blend(b, gray * 1.2, 0.4)
        ;[r, g, b] = adjustSaturation(r, g, b, 0.6)
        r = adjustContrast(r, 1.1) * 0.9
        g = adjustContrast(g, 1.1) * 0.9
        b = adjustContrast(b, 1.1) * 0.9
        break
      }
      case 'lomo': {
        ;[r, g, b] = adjustSaturation(r, g, b, 1.8)
        r = adjustContrast(r, 1.3) * 0.95 * 1.06
        g = adjustContrast(g, 1.3) * 0.95
        b = adjustContrast(b, 1.3) * 0.95 * 0.95
        break
      }
      case 'bleach': {
        ;[r, g, b] = adjustSaturation(r, g, b, 0.5)
        r = adjustContrast(r, 1.2) * 1.15
        g = adjustContrast(g, 1.2) * 1.15
        b = adjustContrast(b, 1.2) * 1.15
        break
      }
      default:
        break
    }

    d[i] = clamp(r)
    d[i + 1] = clamp(g)
    d[i + 2] = clamp(b)
  }

  ctx.putImageData(imageData, x, y)
}

export function drawImageWithFilter({
  ctx,
  img,
  x,
  y,
  width,
  height,
  filterCss,
  filterId,
  drawImageCover,
}) {
  const canUseNative = supportsCanvasFilter()
  if (canUseNative && filterCss && filterCss !== 'none') {
    ctx.filter = filterCss
    drawImageCover(ctx, img, x, y, width, height)
    ctx.filter = 'none'
    return
  }

  drawImageCover(ctx, img, x, y, width, height)

  if (filterId && filterId !== 'none') {
    applyFallbackFilterToRegion(ctx, x, y, width, height, filterId)
  }
}

