'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        console.log('SW registered, scope:', reg.scope)
      } catch (err) {
        console.warn('SW registration failed:', err)
      }
    }

    register()
  }, [])

  return null
}
