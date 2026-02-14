import { render } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'
import ReactPlayer from 'react-player'
import { ExternalLink, Volume2, VolumeX, Play } from 'lucide-react'
import styles from './style.css?inline'

function getSessionId(projectId) {
  try {
    return localStorage.getItem(`bonsai_session_${projectId}`)
  } catch {
    return null
  }
}

function setSessionId(projectId, sessionId) {
  try {
    localStorage.setItem(`bonsai_session_${projectId}`, sessionId)
  } catch {
    // localStorage unavailable
  }
}

async function sendEvent(apiUrl, payload) {
  try {
    const res = await fetch(`${apiUrl}/api/widget/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      return await res.json()
    }
  } catch {
    // Silently fail — event logging should not break the widget
  }
  return null
}

function sendEventBeacon(apiUrl, payload) {
  console.log('Sending beacon event:', payload)
  try {
    const blob = new Blob([JSON.stringify(payload)], {
      type: 'application/json',
    })
    navigator.sendBeacon(`${apiUrl}/api/widget/events`, blob)
  } catch {
    // Silently fail
  }
}

function VideoWidget({ config, apiUrl }) {
  const playerRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentSlotId, setCurrentSlotId] = useState(config.entrySlotId)
  const [currentSubtitle, setCurrentSubtitle] = useState('')
  const [historyStack, setHistoryStack] = useState([config.entrySlotId])
  const [isMuted, setIsMuted] = useState(false)
  // played_seconds 計算用:
  // playStartTimeRef: 現在の再生区間の開始位置(currentTime)。再生中はnull以外、一時停止中はnull
  // accumulatedSecondsRef: 一時停止ごとに加算される累積再生秒数
  // 最終的な played_seconds = accumulatedSecondsRef + (現在のcurrentTime - playStartTimeRef)
  const playStartTimeRef = useRef(null)
  const accumulatedSecondsRef = useRef(0)
  // video_start イベントの重複送信防止用フラグ。
  // 各スロットで最初の再生開始時のみ true にし、スロット切替・クローズ時に false にリセットする
  const videoStartSentRef = useRef(false)

  const currentSlot = config.slots.find((s) => s.id === currentSlotId)
  const nextSlotIds = config.transitions
    .filter((t) => t.fromSlotId === currentSlotId)
    .map((t) => t.toSlotId)

  const buildEventPayload = (extra) => {
    const sessionId = getSessionId(config.projectId)
    return {
      project_id: config.projectId,
      ...(sessionId ? { session_id: sessionId } : {}),
      ...extra,
    }
  }

  // 現在の再生区間の秒数を累積値に加算し、区間をリセットする
  const flushAccumulated = () => {
    if (playStartTimeRef.current !== null) {
      const currentTime = playerRef.current?.currentTime ?? 0
      accumulatedSecondsRef.current += currentTime - playStartTimeRef.current
      playStartTimeRef.current = null
    }
  }

  // 累積した played_seconds を送信し、カウンターをリセットする
  const sendVideoView = (slotId, useBeacon = false) => {
    flushAccumulated()
    const playedSeconds = accumulatedSecondsRef.current
    accumulatedSecondsRef.current = 0
    if (playedSeconds <= 0) return

    const payload = buildEventPayload({
      event_type: 'video_view',
      slot_id: slotId,
      video_id: currentSlot.video.id,
      played_seconds: playedSeconds,
    })
    if (useBeacon) {
      sendEventBeacon(apiUrl, payload)
    } else {
      sendEvent(apiUrl, payload)
    }
  }

  // 再生開始/再開時: 新しい再生区間の開始位置を記録
  const handlePlaying = () => {
    playStartTimeRef.current = playerRef.current?.currentTime ?? 0
    if (!videoStartSentRef.current) {
      videoStartSentRef.current = true
      const payload = buildEventPayload({
        event_type: 'video_start',
        slot_id: currentSlotId,
        video_id: currentSlot.video.id,
      })
      sendEvent(apiUrl, payload)
    }
  }

  // 一時停止時: 区間の秒数を累積に加算するだけ（ログ送信しない）
  const handlePause = () => {
    flushAccumulated()
  }

  const handleEnded = () => {
    sendVideoView(currentSlotId)
    setIsPlaying(false)
  }

  const handleCircleClick = async () => {
    setIsExpanded(true)
    setIsPlaying(true)

    const sessionId = getSessionId(config.projectId)
    const result = await sendEvent(apiUrl, {
      project_id: config.projectId,
      event_type: 'widget_open',
      referrer: window.location.href,
      ...(sessionId ? { session_id: sessionId } : {}),
    })
    if (result?.session_id) {
      setSessionId(config.projectId, result.session_id)
    }
  }

  const handleClose = (e) => {
    e.stopPropagation()
    sendVideoView(currentSlotId)
    videoStartSentRef.current = false
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
    sendVideoView(currentSlotId)
    videoStartSentRef.current = false
    setHistoryStack([...historyStack, slotId])
    setCurrentSlotId(slotId)
    setProgress(0)
    setCurrentSubtitle('')
    setIsPlaying(true)
  }

  const handleGoBack = () => {
    if (historyStack.length <= 1) return

    sendVideoView(currentSlotId)
    videoStartSentRef.current = false
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

  // Send video_view via sendBeacon when page is unloaded (tab close / navigate away)
  // pagehide はタブ閉じ・ページ遷移時のみ発火（タブ切り替えでは発火しない）
  useEffect(() => {
    const handlePageHide = () => {
      const hasUnsent =
        playStartTimeRef.current !== null || accumulatedSecondsRef.current > 0
      if (hasUnsent) {
        sendVideoView(currentSlotId, true)
      }
    }
    window.addEventListener('pagehide', handlePageHide)
    return () => {
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [currentSlotId])

  if (!currentSlot || !currentSlot.video) return null

  return (
    <div class={`video-widget ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {!isExpanded ? (
        <div class="widget-circle" onClick={handleCircleClick}>
          {config.thumbnailUrl && (
            <img class="circle-thumbnail" src={config.thumbnailUrl} alt="" />
          )}
          <div class="circle-play-icon">
            <Play fill="black" />
          </div>
        </div>
      ) : (
        <div
          class="video-container"
          style={
            config.backgroundUrl
              ? {
                  backgroundImage: `url(${config.backgroundUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {}
          }
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
            onPlaying={handlePlaying}
            onPause={handlePause}
            onEnded={handleEnded}
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
                  onClick={() => handleExternalLink(currentSlot.ctaButtonUrl)}
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
  // Get projectId from script tag or env var, apiUrl from env var (baked in at build time)
  const scriptTag = document.querySelector('script[data-project-id]')
  const projectId =
    scriptTag?.getAttribute('data-project-id') ||
    import.meta.env.VITE_PROJECT_ID
  const apiUrl = import.meta.env.VITE_API_URL

  if (!projectId || !apiUrl) {
    console.error('[BonsAI Video] Missing data-project-id or VITE_API_URL')
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
    render(<VideoWidget config={config} apiUrl={apiUrl} />, shadow)
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
