import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * useScreenRecording
 *
 * Handles two proctoring features:
 * 1. Screen Recording — user shares their screen via getDisplayMedia()
 *    The stream can be shown as preview and/or fed to a MediaRecorder.
 * 2. Screen Capture — periodic screenshots taken from the shared stream
 *    using an offscreen canvas. In production, upload to backend.
 *
 * status: 'idle' | 'requesting' | 'active' | 'stopped' | 'error'
 */
export default function useScreenRecording({
  captureIntervalSec = 30,
  enabled = false,
} = {}) {
  const [status, setStatus] = useState('idle')
  const [errorMessage, setErrorMessage] = useState(null)
  const [captures, setCaptures] = useState([])      // array of { dataUrl, timestamp }
  const [captureCount, setCaptureCount] = useState(0)
  const [isRecording, setIsRecording] = useState(false)

  const streamRef = useRef(null)
  const videoRef = useRef(null)                     // attach to <video> for preview
  const recorderRef = useRef(null)
  const captureIntervalRef = useRef(null)
  const canvasRef = useRef(document.createElement('canvas'))

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAll()
    }
  }, [])

  // ── Request screen share ────────────────────────────────────────────────
  const requestScreenShare = useCallback(async () => {
    setStatus('requesting')
    setErrorMessage(null)

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // Detect when user manually stops sharing
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        setStatus('stopped')
        setIsRecording(false)
        clearInterval(captureIntervalRef.current)
      })

      setStatus('active')
      return stream
    } catch (e) {
      const msg = e.name === 'NotAllowedError'
        ? 'Izin screen sharing ditolak. Harap pilih jendela atau layar yang ingin dibagikan.'
        : `Gagal memulai screen sharing: ${e.message}`
      setErrorMessage(msg)
      setStatus('error')
      return null
    }
  }, [])

  // ── Start recording (MediaRecorder) ─────────────────────────────────────
  const startRecording = useCallback(async () => {
    let stream = streamRef.current
    if (!stream) {
      stream = await requestScreenShare()
      if (!stream) return
    }

    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm'

      const recorder = new MediaRecorder(stream, { mimeType })
      recorderRef.current = recorder

      const chunks = []
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType })
        const url = URL.createObjectURL(blob)
        // In production: upload blob to backend
        // For demo: trigger download
        const a = document.createElement('a')
        a.href = url
        a.download = `screen-recording-${Date.now()}.webm`
        a.click()
        URL.revokeObjectURL(url)
      }

      recorder.start(1000) // collect data every 1s
      setIsRecording(true)
    } catch (e) {
      setErrorMessage(`Gagal memulai recording: ${e.message}`)
    }
  }, [requestScreenShare])

  // ── Start periodic screen capture ───────────────────────────────────────
  const startCapture = useCallback(async () => {
    let stream = streamRef.current
    if (!stream) {
      stream = await requestScreenShare()
      if (!stream) return
    }

    const doCapture = () => {
      const track = stream.getVideoTracks()[0]
      if (!track || track.readyState !== 'live') return

      const settings = track.getSettings()
      const w = settings.width || 1280
      const h = settings.height || 720

      const canvas = canvasRef.current
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')

      // Draw from video element if available
      if (videoRef.current && videoRef.current.readyState >= 2) {
        ctx.drawImage(videoRef.current, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        const timestamp = new Date().toISOString()
        setCaptures(prev => [...prev.slice(-19), { dataUrl, timestamp }]) // keep last 20
        setCaptureCount(n => n + 1)
        // In production: upload dataUrl or canvas blob to backend
      }
    }

    // Immediate first capture
    setTimeout(doCapture, 1000)
    // Then periodic
    captureIntervalRef.current = setInterval(doCapture, captureIntervalSec * 1000)
  }, [requestScreenShare, captureIntervalSec])

  // ── Stop everything ──────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    clearInterval(captureIntervalRef.current)
    recorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    recorderRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setStatus('stopped')
    setIsRecording(false)
  }, [])

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop()
    setIsRecording(false)
  }, [])

  return {
    status,
    errorMessage,
    isRecording,
    captureCount,
    captures,
    videoRef,
    requestScreenShare,
    startRecording,
    startCapture,
    stopAll,
    stopRecording,
  }
}
