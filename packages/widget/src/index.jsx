import { render } from 'preact'
import { useRef, useState } from 'preact/hooks'
import ReactPlayer from 'react-player'
import styles from './style.css?inline'

const videoConfig = [
  {
    text: 'オープニング',
    videoUrl: `${import.meta.env.VITE_BASE_URL}/aloop/ayumi_0.mp4`,
  },
  {
    text: 'アループクリニックの特徴',
    videoUrl: `${import.meta.env.VITE_BASE_URL}/aloop/ayumi_1.mp4`,
  },
  {
    text: '院長・医師の紹介',
    videoUrl: `${import.meta.env.VITE_BASE_URL}/aloop/ayumi_2.mp4`,
  },
  {
    text: '予約から診察の流れ',
    videoUrl: `${import.meta.env.VITE_BASE_URL}/aloop/ayumi_3.mp4`,
  },
  {
    text: '料金プランについて',
    videoUrl: `${import.meta.env.VITE_BASE_URL}/aloop/ayumi_4.mp4`,
  },
  {
    text: '施術ラインナップ',
    videoUrl: `${import.meta.env.VITE_BASE_URL}/aloop/ayumi_5.mp4`,
  },
  {
    text: 'おすすめの施術',
    videoUrl: `${import.meta.env.VITE_BASE_URL}/aloop/ayumi_6.mp4`,
  },
]

function VideoWidget() {
  const playerRef = useRef(null)
  const thumbnailRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)

  const currentVideo = videoConfig[currentVideoIndex]

  const handleCircleClick = () => {
    setIsExpanded(true)
    setIsPlaying(true)
  }

  const handleClose = (e) => {
    e.stopPropagation()
    setIsExpanded(false)
    setIsPlaying(false)
  }

  const handleTimeUpdate = () => {
    const player = playerRef.current
    setProgress((player.currentTime / player.duration) * 100)
  }

  const handleProgressBarClick = (e) => {
    e.stopPropagation()
    const progressBar = e.currentTarget
    const rect = progressBar.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width

    if (playerRef.current) {
      playerRef.current.seekTo(percentage, 'fraction')
    }
  }

  const handleVideoSelect = (index) => {
    if (index === currentVideoIndex) return
    setCurrentVideoIndex(index)
    setProgress(0)
    setIsPlaying(true)
  }

  return (
    <div class={`video-widget ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {!isExpanded ? (
        <div class="widget-circle" onClick={handleCircleClick}>
          <video
            ref={thumbnailRef}
            class="circle-thumbnail"
            src={currentVideo.videoUrl}
            muted
            playsInline
          />
          <div class="circle-play-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"></path>
            </svg>
          </div>
        </div>
      ) : (
        <div class="video-container">
          <div class="video-header">
            <div
              class="progress-bar-container"
              onClick={handleProgressBarClick}
            >
              <div class="progress-bar-bg">
                <div
                  class="progress-bar-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
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
          </div>
          <ReactPlayer
            ref={playerRef}
            src={currentVideo.videoUrl}
            playing={isPlaying}
            controls={false}
            width="100%"
            height="100%"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false)
              setIsExpanded(false)
            }}
            onTimeUpdate={handleTimeUpdate}
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
            <div class="video-list">
              {videoConfig.map((video, index) => (
                <button
                  key={index}
                  class={`video-item ${index === currentVideoIndex ? 'active' : ''}`}
                  onClick={() => handleVideoSelect(index)}
                >
                  {video.text}
                </button>
              ))}
            </div>
          </div>
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
