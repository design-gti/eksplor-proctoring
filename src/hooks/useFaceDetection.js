import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Mock face detection hook.
 * In production, integrate Google Cloud Vision API or TensorFlow.js face detection.
 * Currently simulates: loading → no face detected state.
 */
export default function useFaceDetection({ showVideo = false, enabled = true } = {}) {
  const [faceDetected, setFaceDetected] = useState(false)
  const [faceCount, setFaceCount] = useState(0)
  const [hasMultipleFaces, setHasMultipleFaces] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  useEffect(() => {
    if (!enabled) return
    const timer = setTimeout(() => setLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [enabled])

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (e) {
      setError(e.message)
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  // Simulate detection result for demo
  const simulateDetected = useCallback((detected, count = 1) => {
    setFaceDetected(detected)
    setFaceCount(detected ? count : 0)
    setHasMultipleFaces(count > 1)
    setLoading(false)
  }, [])

  return {
    faceDetected,
    faceCount,
    hasMultipleFaces,
    loading,
    error,
    videoRef,
    startCamera,
    stopCamera,
    simulateDetected,
    setFaceDetected,
    setFaceCount,
    setHasMultipleFaces,
    setLoading,
  }
}
