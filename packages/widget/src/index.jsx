import { render } from 'preact'
import { useRef, useState } from 'preact/hooks'
import ReactPlayer from 'react-player'
import styles from './style.css?inline'
import videoUrl from '/sample.mp4'

function VideoWidget() {
  const playerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div class="video-widget">
      <div class="video-container">
        <ReactPlayer
          ref={playerRef}
          src={videoUrl}
          playing={isPlaying}
          controls={false}
          width="100%"
          height="100%"
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />
        <div class="controls">
          <button class="play-button" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? '⏸️' : '▶️'}
          </button>
        </div>
      </div>
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
