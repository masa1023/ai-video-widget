import { render } from 'preact'
import { useRef, useState } from 'preact/hooks'
import ReactPlayer from 'react-player'
import { ExternalLink, Volume2, VolumeX, Play } from 'lucide-react'
import styles from './style.css?inline'
import { videoConfig } from './video-config/degipro.js'
import { navigationGraph, rootNodeId } from './navigation-graph/degipro.js'

function VideoWidget() {
  const playerRef = useRef(null)
  const thumbnailRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentNodeId, setCurrentNodeId] = useState(rootNodeId)
  const [currentSubtitle, setCurrentSubtitle] = useState('')
  const [historyStack, setHistoryStack] = useState([rootNodeId])
  const [isMuted, setIsMuted] = useState(false)

  const currentNode = navigationGraph[currentNodeId]
  const currentVideo = videoConfig.find((v) => v.id === currentNode.videoId)

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

    // Update subtitles based on current time
    const subtitles = currentVideo.subtitles || []
    const activeSubtitle = subtitles.find(
      (subtitle) => currentTime >= subtitle.start && currentTime <= subtitle.end
    )
    if (activeSubtitle) {
      setCurrentSubtitle(activeSubtitle.text)
    }
  }

  const handleVideoSelect = (nodeId) => {
    setHistoryStack([...historyStack, nodeId])
    setCurrentNodeId(nodeId)
    setProgress(0)
    setCurrentSubtitle('')
    setIsPlaying(true)
  }

  const handleGoBack = () => {
    if (historyStack.length <= 1) return

    const newStack = historyStack.slice(0, -1)
    setHistoryStack(newStack)
    setCurrentNodeId(newStack[newStack.length - 1])
    setProgress(0)
    setCurrentSubtitle('')
    setIsPlaying(true)
  }

  const handleExternalLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div class={`video-widget ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {!isExpanded ? (
        <div class="widget-circle" onClick={handleCircleClick}>
          <img
            ref={thumbnailRef}
            class="circle-thumbnail"
            src={`${import.meta.env.VITE_BASE_URL}degipro/video-thumbnail.png`}
            alt="Video thumbnail"
          />
          <div class="circle-play-icon">
            <Play fill="black" />
          </div>
        </div>
      ) : (
        <div
          class="video-container"
          style={{
            backgroundImage: `url(${import.meta.env.VITE_BASE_URL}degipro/video-background.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
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
            src={currentVideo.videoUrl}
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
              {currentNode.nextNodeIds.length > 0 && (
                <div class="next-videos-section">
                  {currentNode.nextNodeIds.map((nextNodeId) => {
                    const video = videoConfig.find(
                      (v) => v.id === navigationGraph[nextNodeId].videoId
                    )
                    return video ? (
                      <button
                        key={nextNodeId}
                        class="next-video-button"
                        onClick={() => handleVideoSelect(nextNodeId)}
                      >
                        {video.title}
                      </button>
                    ) : null
                  })}
                </div>
              )}
              {currentVideo.detailButton && (
                <button
                  class="detail-button"
                  onClick={() =>
                    handleExternalLink(currentVideo.detailButton.link)
                  }
                >
                  {currentVideo.detailButton.text}
                  <ExternalLink size={18} />
                </button>
              )}
              {currentVideo.ctaButton && (
                <button
                  class="cta-button"
                  onClick={() =>
                    handleExternalLink(currentVideo.ctaButton.link)
                  }
                >
                  {currentVideo.ctaButton.text}
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

function init() {
  const container = document.createElement('div')
  document.body.appendChild(container)

  const shadow = container.attachShadow({ mode: 'closed' })

  const style = document.createElement('style')
  style.textContent = styles

  shadow.appendChild(style)
  render(<VideoWidget />, shadow)
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
}
