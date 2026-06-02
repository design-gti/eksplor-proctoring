import { useState, useEffect, useCallback, useRef } from 'react'

export default function useTabSwitch() {
  const [tabSwitchCount, setTabSwitchCount] = useState(0)
  const hiddenAt = useRef(null)

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now()
      } else if (hiddenAt.current && Date.now() - hiddenAt.current > 1000) {
        setTabSwitchCount(c => c + 1)
        hiddenAt.current = null
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const resetTabSwitchCount = useCallback(() => setTabSwitchCount(0), [])

  return { tabSwitchCount, resetTabSwitchCount }
}
