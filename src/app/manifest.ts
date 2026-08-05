import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ember',
    short_name: 'Ember',
    description: 'Personal habit & gym tracker — keep your daily flame alive.',
    start_url: '/today',
    display: 'standalone',
    background_color: '#141210',
    theme_color: '#141210',
    icons: [
      { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
  }
}
