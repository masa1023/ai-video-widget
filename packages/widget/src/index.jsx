import { render } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import './style.css'

function VideoWidget() {
  const videoRef = useRef(null)
  const playerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (videoRef.current && !playerRef.current) {
      const player = videojs(videoRef.current, {
        controls: false,
        fluid: false,
        width: 268,
        height: 150,
        sources: [
          {
            src: '/sample.mp4',
            type: 'video/mp4',
          },
        ],
      })

      playerRef.current = player

      player.on('play', () => setIsPlaying(true))
      player.on('pause', () => setIsPlaying(false))
      player.on('ended', () => setIsPlaying(false))
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose()
        playerRef.current = null
      }
    }
  }, [])

  const handlePlayPause = () => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause()
      } else {
        playerRef.current.play()
      }
    }
  }

  return (
    <div class="video-widget">
      <div class="video-container">
        <video
          ref={videoRef}
          class="video-js vjs-default-skin"
          preload="auto"
          data-setup="{}"
        />
      </div>
      <div class="controls">
        <button class="play-button" onClick={handlePlayPause}>
          {isPlaying ? '⏸️' : '▶️'}
        </button>
      </div>
    </div>
  )
}

function init() {
  const container = document.createElement('div')
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
