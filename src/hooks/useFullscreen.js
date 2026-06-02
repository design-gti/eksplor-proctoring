import { useState, useEffect, useCallback } from 'react'

export default function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement)
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0)

  useEffect(() => {
    const handler = () => {
      const active = !!document.fullscreenElement
      if (isFullscreen && !active) {
        setFullscreenExitCount(c => c + 1)
      }
      setIsFullscreen(active)
    }
    document.addEventListener('fullscreenchange', handler)
    document.addEventListener('webkitfullscreenchange', handler)
    return () => {
      document.removeEventListener('fullscreenchange', handler)
      document.removeEventListener('webkitfullscreenchange', handler)
    }
  }, [isFullscreen])

  const requestFullscreen = useCallback(() => {
    document.documentElement.requestFullscreen?.()
  }, [])

  const exitFullscreen = useCallback(() => {
    document.exitFullscreen?.()
  }, [])

  const resetFullscreenExitCount = useCallback(() => setFullscreenExitCount(0), [])

  return { isFullscreen, fullscreenExitCount, requestFullscreen, exitFullscreen, resetFullscreenExitCount }
}
