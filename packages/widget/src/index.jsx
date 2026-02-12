import { render } from 'preact'
import { useRef, useState } from 'preact/hooks'
import ReactPlayer from 'react-player'
import { ExternalLink, Volume2, VolumeX, Play } from 'lucide-react'
import styles from './style.css?inline'

function VideoWidget({ config }) {
  const playerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentSlotId, setCurrentSlotId] = useState(config.entrySlotId)
  const [currentSubtitle, setCurrentSubtitle] = useState('')
  const [historyStack, setHistoryStack] = useState([config.entrySlotId])
  const [isMuted, setIsMuted] = useState(false)

  const currentSlot = config.slots.find((s) => s.id === currentSlotId)
  const nextSlotIds = config.transitions
    .filter((t) => t.fromSlotId === currentSlotId)
    .map((t) => t.toSlotId)

  const handleCircleClick = () => {
    setIsExpanded(true)
    setIsPlaying(true)
  }

  const handleClose = (e) => {
    e.stopPropagation()
    setIsExpanded(false)
    setIsPlaying(false)
  }

  const handleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleTimeUpdate = () => {
    const {
      current: { currentTime, duration },
    } = playerRef
    setProgress((currentTime / duration) * 100)
  }

  const handleSlotSelect = (slotId) => {
    setHistoryStack([...historyStack, slotId])
    setCurrentSlotId(slotId)
    setProgress(0)
    setCurrentSubtitle('')
    setIsPlaying(true)
  }

  const handleGoBack = () => {
    if (historyStack.length <= 1) return

    const newStack = historyStack.slice(0, -1)
    setHistoryStack(newStack)
    setCurrentSlotId(newStack[newStack.length - 1])
    setProgress(0)
    setCurrentSubtitle('')
    setIsPlaying(true)
  }

  const handleExternalLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  if (!currentSlot || !currentSlot.video) return null

  return (
    <div class={`video-widget ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {!isExpanded ? (
        <div class="widget-circle" onClick={handleCircleClick}>
          {config.thumbnailUrl && (
            <img
              class="circle-thumbnail"
              src={config.thumbnailUrl}
              alt=""
            />
          )}
          <div class="circle-play-icon">
            <Play fill="black" />
          </div>
        </div>
      ) : (
        <div
          class="video-container"
          style={config.backgroundUrl ? {
            backgroundImage: `url(${config.backgroundUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : {}}
        >
          <div class="video-header">
            <div class="progress-bar-container">
              <div class="progress-bar-bg">
                <div
                  class="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            <div class="video-handlers">
              <button
                class="back-button"
                onClick={handleGoBack}
                title="前の動画に戻る"
                style={{
                  visibility: historyStack.length > 1 ? 'unset' : 'hidden',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7"></path>
                </svg>
              </button>
              <div class="right-buttons">
                <button class="close-button" onClick={handleClose}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                <button class="close-button" onClick={handleMute}>
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              </div>
            </div>
          </div>
          <ReactPlayer
            ref={playerRef}
            src={currentSlot.video.url}
            playing={isPlaying}
            controls={false}
            playsInline={true}
            width="100%"
            height="100%"
            onEnded={() => {
              setIsPlaying(false)
            }}
            onTimeUpdate={handleTimeUpdate}
            muted={isMuted}
          />

          <div class="video-controls" onClick={() => setIsPlaying(!isPlaying)}>
            <button class="play-button">
              {isPlaying ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="4" width="4" height="16"></rect>
                  <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z"></path>
                </svg>
              )}
            </button>
          </div>
          <div class="video-selector">
            {currentSubtitle && (
              <div class="subtitle-container">
                <div class="subtitle-text">{currentSubtitle}</div>
              </div>
            )}
            <div class="button-container">
              {nextSlotIds.length > 0 && (
                <div class="next-videos-section">
                  {nextSlotIds.map((nextSlotId) => {
                    const nextSlot = config.slots.find(
                      (s) => s.id === nextSlotId
                    )
                    return nextSlot ? (
                      <button
                        key={nextSlotId}
                        class="next-video-button"
                        onClick={() => handleSlotSelect(nextSlotId)}
                      >
                        {nextSlot.title}
                      </button>
                    ) : null
                  })}
                </div>
              )}
              {currentSlot.detailButtonText && currentSlot.detailButtonUrl && (
                <button
                  class="detail-button"
                  onClick={() =>
                    handleExternalLink(currentSlot.detailButtonUrl)
                  }
                >
                  {currentSlot.detailButtonText}
                  <ExternalLink size={18} />
                </button>
              )}
              {currentSlot.ctaButtonText && currentSlot.ctaButtonUrl && (
                <button
                  class="cta-button"
                  onClick={() =>
                    handleExternalLink(currentSlot.ctaButtonUrl)
                  }
                >
                  {currentSlot.ctaButtonText}
                  <ExternalLink size={18} />
                </button>
              )}
            </div>
          </div>
          <div class="video-footer">powered by BonsAI Video</div>
        </div>
      )}
    </div>
  )
}

async function init() {
  // Get projectId and apiUrl from script tag or env vars
  const scriptTag = document.querySelector(
    'script[data-project-id]'
  )
  const projectId =
    scriptTag?.getAttribute('data-project-id') ||
    import.meta.env.VITE_PROJECT_ID
  const apiUrl =
    scriptTag?.getAttribute('data-api-url') ||
    import.meta.env.VITE_API_URL

  if (!projectId || !apiUrl) {
    console.error('[BonsAI Video] Missing data-project-id or data-api-url')
    return
  }

  try {
    const res = await fetch(`${apiUrl}/api/widget/config/${projectId}`)
    if (!res.ok) {
      console.error('[BonsAI Video] Failed to load config:', res.status)
      return
    }

    const config = await res.json()

    if (!config.entrySlotId || !config.slots?.length) {
      console.error('[BonsAI Video] Invalid config: no entry slot or slots')
      return
    }

    const container = document.createElement('div')
    document.body.appendChild(container)

    const shadow = container.attachShadow({ mode: 'closed' })

    const style = document.createElement('style')
    style.textContent = styles

    shadow.appendChild(style)
    render(<VideoWidget config={config} />, shadow)
  } catch (err) {
    console.error('[BonsAI Video] Failed to initialize:', err)
  }
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
}
