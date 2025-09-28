import { render } from 'preact'
import { useRef, useState } from 'preact/hooks'
import ReactPlayer from 'react-player'
import './style.css'

function VideoWidget() {
  const playerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <div class="video-widget">
      <div class="video-container">
        <ReactPlayer
          ref={playerRef}
          src="/sample.mp4"
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
  // const shadow = container.attachShadow({ mode: 'closed' })
  document.body.appendChild(container)
  render(<VideoWidget />, container)
}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
}
