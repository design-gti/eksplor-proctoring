import { useState, useCallback } from 'react'

export default function useScreenShare() {
  const [isScreenShared, setIsScreenShared] = useState(false)

  const checkScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      setIsScreenShared(true)
      stream.getTracks().forEach(t => {
        t.addEventListener('ended', () => setIsScreenShared(false))
      })
    } catch {
      setIsScreenShared(false)
    }
  }, [])

  return { isScreenShared }
}
