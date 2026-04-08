import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Camera, Trash2, Timer, Download, RotateCcw, RefreshCw } from 'lucide-react'
import { useCamera } from '../hooks/useCamera'
import FilterSelector, { FILTERS } from './FilterSelector'
import CountdownOverlay from './CountdownOverlay'
import FilmStrip from './FilmStrip'
import DownloadModal from './DownloadModal'
import StripPreviewModal from './StripPreviewModal'

const MAX_PHOTOS = 3
const TIMER_OPTIONS = [0, 3, 5, 10]
const AUTO_SHOTS = 3
const AUTO_MESSAGE_DELAY_MS = 2000

export default function Booth() {
  const { videoRef, canvasRef, isReady, error, capture, flipCamera } = useCamera()
  const [filter, setFilter] = useState(FILTERS[0])
  const [photos, setPhotos] = useState([])
  const [isCounting, setIsCounting] = useState(false)
  const [isFlashing, setIsFlashing] = useState(false)
  const [isShaking, setIsShaking] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(3)
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [showDownload, setShowDownload] = useState(false)
  const [showStripPreview, setShowStripPreview] = useState(false)
  const [isAutoBooth, setIsAutoBooth] = useState(false)
  const [boothMessage, setBoothMessage] = useState('')
  const boothRef = useRef(null)
  const photosRef = useRef(photos)
  const autoCountRef = useRef(0)
  const messageTimeoutRef = useRef(null)

  useEffect(() => {
    photosRef.current = photos
  }, [photos])

  const activeCountdownSeconds = timerSeconds > 0 ? timerSeconds : 3

  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current)
      }
    }
  }, [])

  const scheduleCountdown = useCallback((message, delay = AUTO_MESSAGE_DELAY_MS) => {
    setBoothMessage(message)
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current)
    }
    messageTimeoutRef.current = setTimeout(() => {
      setBoothMessage('')
      setIsCounting(true)
    }, delay)
  }, [])

  const triggerShutter = useCallback(() => {
    const dataUrl = capture(filter.css)
    if (!dataUrl) return

    // Flash effect
    setIsFlashing(true)
    setTimeout(() => setIsFlashing(false), 500)

    // Shake booth
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 400)

    setPhotos(prev => {
      const next = [...prev, { dataUrl, filter, takenAt: new Date() }].slice(-MAX_PHOTOS)
      setSelectedIdx(next.length - 1)
      return next
    })
  }, [capture, filter])

  const handleShoot = useCallback(() => {
    if (isCounting || photosRef.current.length >= MAX_PHOTOS) return
    if (timerSeconds > 0) {
      setIsCounting(true)
    } else {
      triggerShutter()
    }
  }, [isCounting, timerSeconds, triggerShutter])

  const handleCountDone = useCallback(() => {
    setIsCounting(false)
    triggerShutter()
    if (!isAutoBooth) return

    autoCountRef.current += 1
    if (autoCountRef.current >= AUTO_SHOTS) {
      setIsAutoBooth(false)
      setBoothMessage('')
      return
    }

    scheduleCountdown('Get ready for the next picture')
  }, [triggerShutter, isAutoBooth, scheduleCountdown])

  const deletePhoto = (idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    setSelectedIdx(null)
  }

  const retakePhoto = useCallback((idx) => {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    setSelectedIdx(null)
    // Start a new shot right after state flushes.
    setTimeout(() => handleShoot(), 0)
  }, [handleShoot])

  const clearAll = () => {
    setPhotos([])
    setSelectedIdx(null)
  }

  const startAutoBooth = useCallback(() => {
    if (isCounting || isAutoBooth || !isReady) return

    setPhotos([])
    setSelectedIdx(null)
    autoCountRef.current = 0
    setIsAutoBooth(true)
    scheduleCountdown('Get ready for a real photobooth experience')
  }, [isCounting, isAutoBooth, isReady, scheduleCountdown])

  return (
    <div
      ref={boothRef}
      className="min-h-screen flex flex-col items-center justify-start py-6 px-4 gap-5"
      style={{ background: 'radial-gradient(ellipse at top, #2a1f14 0%, #0d0b09 70%)' }}
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-0.5">
        <h1
          className="font-display text-4xl text-film-cream"
          style={{ letterSpacing: '0.05em', textShadow: '0 2px 12px rgba(200,134,42,0.3)' }}
        >
          Pellicula 🎞️
        </h1>
        <p className="font-mono text-[10px] tracking-[0.5em] text-film-sepia uppercase">
          Vintage Photobooth
        </p>
      </div>

      {/* Camera viewport */}
      <div
        className={`relative rounded-sm overflow-hidden ${isShaking ? 'shake' : ''}`}
        style={{
          width: '100%',
          maxWidth: 520,
          background: '#0d0b09',
          border: '3px solid #2a1f14',
          boxShadow: '0 0 40px rgba(0,0,0,0.8), inset 0 0 60px rgba(0,0,0,0.4)',
        }}
      >
        {/* Corner decorations */}
        <div className="absolute inset-0 pointer-events-none z-10 corner-tl corner-tr corner-bl corner-br" />

        {/* Video */}
        {error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Camera size={40} className="text-film-sepia" />
            <p className="font-mono text-sm text-film-silver text-center px-4">{error}</p>
            <p className="font-mono text-xs text-film-sepia/60 text-center px-4">
              Allow camera access and refresh to use Pellicula
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full block vignette"
              style={{
                filter: filter.css,
                transform: 'scaleX(-1)',
                aspectRatio: '4/3',
                objectFit: 'cover',
                display: 'block',
              }}
              autoPlay
              playsInline
              muted
            />
            {!isReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-film-black">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="w-8 h-8 border-2 border-film-amber border-t-transparent rounded-full"
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                  <span className="font-mono text-xs text-film-sepia tracking-widest">Loading film…</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Flash overlay */}
        {isFlashing && (
          <div className="absolute inset-0 bg-white z-20 flash-overlay pointer-events-none" />
        )}

        {/* Countdown */}
        {isCounting && (
          <CountdownOverlay from={activeCountdownSeconds} onDone={handleCountDone} />
        )}

        {/* Auto booth status message */}
        {boothMessage && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 px-3 py-2 text-center photo-appear w-fit max-w-[calc(100%-1rem)]">
            <div
              style={{
                background: 'rgba(13,11,9,0.82)',
                border: '1px solid #c8862a',
                boxShadow: '0 8px 20px rgba(0,0,0,0.55), 0 0 12px rgba(200,134,42,0.35)',
              }}
            >
              <span
                className="font-mono text-[12px] md:text-[13px] tracking-[0.12em] text-film-cream uppercase"
                style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
              >
                {boothMessage}
              </span>
            </div>
          </div>
        )}

        {/* Top-right — flip camera */}
        <button
          onClick={flipCamera}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full btn-press"
          style={{ background: 'rgba(13,11,9,0.6)', border: '1px solid #3a2d1e' }}
          title="Flip camera"
        >
          <RotateCcw size={14} className="text-film-silver" />
        </button>

        {/* Film type badge */}
        <div
          className="absolute bottom-3 left-3 z-10 px-2 py-0.5"
          style={{ background: 'rgba(13,11,9,0.7)', border: '1px solid #3a2d1e' }}
        >
          <span className="font-mono text-[9px] tracking-widest text-film-sepia uppercase">
            {filter.label}
          </span>
        </div>

        {/* Shot counter */}
        <div
          className="absolute bottom-3 right-3 z-10 px-2 py-0.5"
          style={{ background: 'rgba(13,11,9,0.7)', border: '1px solid #3a2d1e' }}
        >
          <span className="font-mono text-[9px] tracking-widest text-film-sepia">
            {photos.length}/{MAX_PHOTOS}
          </span>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>

      {/* Filter selector */}
      <div className="w-full max-w-xl">
        <FilterSelector selected={filter} onChange={setFilter} videoRef={videoRef} />
      </div>

      {/* Controls — 3-column layout keeps shutter fixed and prevents overlap */}
      <div className="w-full max-w-xl grid grid-cols-3 items-center min-h-[4.5rem]">
        {/* Left: timer */}
        <div className="justify-self-start flex items-center gap-3">
          <button
            onClick={() => {
              const currentIdx = TIMER_OPTIONS.indexOf(timerSeconds)
              const nextIdx = (currentIdx + 1) % TIMER_OPTIONS.length
              setTimerSeconds(TIMER_OPTIONS[nextIdx])
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-sm font-mono text-[11px] tracking-widest uppercase btn-press transition-colors`}
            style={{
              border: `1px solid ${timerSeconds > 0 ? '#c8862a' : '#3a2d1e'}`,
              background: timerSeconds > 0 ? 'rgba(200,134,42,0.15)' : 'transparent',
              color: timerSeconds > 0 ? '#c8862a' : '#b8a898',
            }}
            title="Tap to change timer"
          >
            <Timer size={13} />
            {timerSeconds > 0 ? `${timerSeconds}s` : 'Off'}
          </button>

          {/* Auto photobooth */}
          <button
            onClick={startAutoBooth}
            disabled={isCounting || isAutoBooth || !isReady}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm font-mono text-[11px] tracking-widest uppercase btn-press transition-colors"
            style={{
              border: `1px solid ${isAutoBooth ? '#8b6914' : '#3a2d1e'}`,
              background: isAutoBooth ? 'rgba(200,134,42,0.15)' : 'transparent',
              color: isAutoBooth ? '#c8862a' : '#b8a898',
            }}
            title="Auto photobooth"
          >
            Auto
          </button>
        </div>

        {/* Center: shutter (always same screen position) */}
        <div className="justify-self-center z-20">
          <button
            onClick={handleShoot}
            disabled={isCounting || isAutoBooth || photos.length >= MAX_PHOTOS || !isReady}
            className="btn-press relative"
            style={{ outline: 'none' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
              style={{
                background: isCounting || photos.length >= MAX_PHOTOS || !isReady
                  ? '#2a1f14'
                  : 'radial-gradient(circle at 35% 35%, #e8a040, #c8862a)',
                border: '3px solid #3a2d1e',
                boxShadow: isCounting ? 'none' : '0 0 20px rgba(200,134,42,0.4)',
              }}
            >
              <Camera
                size={22}
                style={{ color: isCounting || !isReady ? '#3a2d1e' : '#0d0b09' }}
              />
            </div>
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ border: '1px solid #8b691440', margin: -6 }}
            />
          </button>
        </div>

        {/* Right: save + trash */}
        <div className="justify-self-end z-10 flex items-center justify-end gap-3">
          {photos.length > 0 && (
            <button
              onClick={() => setShowDownload(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-sm font-mono text-[11px] tracking-widest uppercase btn-press transition-colors"
              style={{ border: '1px solid #3a2d1e', background: 'transparent', color: '#b8a898' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#8b6914'; e.currentTarget.style.color = '#c8862a' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#3a2d1e'; e.currentTarget.style.color = '#b8a898' }}
            >
              <Download size={13} />
              Save
            </button>
          )}

          {photos.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-sm font-mono text-[11px] tracking-widest uppercase btn-press transition-colors"
              style={{ border: '1px solid #3a2d1e', background: 'transparent', color: '#b8a898' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#9b3a1a'; e.currentTarget.style.color = '#9b3a1a' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#3a2d1e'; e.currentTarget.style.color = '#b8a898' }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Film strip */}
      {photos.length > 0 && (
        <div className="w-full max-w-xl photo-appear">
          <FilmStrip
            photos={photos}
            onSelect={setSelectedIdx}
            selectedIdx={selectedIdx}
            onOpenPreview={() => setShowStripPreview(true)}
          />
        </div>
      )}

      {/* Selected photo enlarged */}
      {selectedIdx !== null && photos[selectedIdx] && (
        <div className="w-full max-w-xl photo-appear">
          <div
            className="relative bg-film-ivory p-3 pb-10 mx-auto"
            style={{ maxWidth: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 4px rgba(0,0,0,0.4)' }}
          >
            <img
              src={photos[selectedIdx].dataUrl}
              alt="Selected"
              className="w-full object-cover"
              style={{ filter: photos[selectedIdx].filter?.css || 'none' }}
            />
            {/* Polaroid caption area */}
            <div className="absolute bottom-2 left-0 right-0 flex items-center justify-between px-4">
              <span className="font-mono text-[9px] text-film-sepia/70 italic">
                {photos[selectedIdx].takenAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => retakePhoto(selectedIdx)}
                  className="text-film-sepia/50 hover:text-film-amber btn-press"
                  title="Delete and retake"
                >
                  <RefreshCw size={11} />
                </button>
                <button
                  onClick={() => deletePhoto(selectedIdx)}
                  className="text-film-sepia/50 hover:text-film-rust btn-press"
                  title="Delete"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for capturing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Footer */}
      <div className="mt-2 text-center">
        <span className="font-mono text-[10px] tracking-widest text-film-sepia/40 uppercase">
          35mm · ISO 400 · ƒ/2.8
        </span>
      </div>

      {/* Download modal */}
      {showDownload && (
        <DownloadModal photos={photos} onClose={() => setShowDownload(false)} />
      )}

      {/* Strip preview modal */}
      {showStripPreview && (
        <StripPreviewModal photos={photos} onClose={() => setShowStripPreview(false)} />
      )}
    </div>
  )
}
