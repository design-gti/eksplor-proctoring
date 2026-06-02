import { useState, useEffect } from 'react'

export default function useMultipleMonitor() {
  const [hasMultipleMonitors, setHasMultipleMonitors] = useState(false)

  useEffect(() => {
    const check = () => {
      if (window.screen.isExtended !== undefined) {
        setHasMultipleMonitors(window.screen.isExtended)
        return
      }
      const extended =
        window.screenLeft < 0 ||
        window.screenTop < 0 ||
        window.screenLeft + window.outerWidth > window.screen.width + 10 ||
        window.screenTop + window.outerHeight > window.screen.height + 10
      setHasMultipleMonitors(extended)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return { hasMultipleMonitors }
}
