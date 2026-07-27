import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tracker',
    short_name: 'Tracker',
    description: 'Personal habit & gym tracker',
    start_url: '/today',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#4f46e5',
    icons: [
      { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
  }
}
