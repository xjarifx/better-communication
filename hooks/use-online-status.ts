import { useEffect, useState } from "react"

/**
 * Hook to detect online/offline status
 * Returns true if app is online (navigator.onLine is true)
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      console.log("[useOnlineStatus] App is online")
      setIsOnline(true)
    }

    const handleOffline = () => {
      console.log("[useOnlineStatus] App is offline")
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}
