import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
                            VitePWA({
                              registerType: 'autoUpdate',
                              includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
                              manifest: {
                                name: 'Orange Perf',
                                short_name: 'OrangePerf',
                                description: 'Dashboard Performance Vendeurs',
                                theme_color: '#FF7900',
                                background_color: '#f4f6fa',
                                display: 'standalone',
                                orientation: 'portrait',
                                icons: [
                                  {
                                    src: 'pwa-192x192.png',
                                    sizes: '192x192',
                                    type: 'image/png'
                                  },
                                  {
                                    src: 'pwa-512x512.png',
                                    sizes: '512x512',
                                    type: 'image/png'
                                  },
                                  {
                                    src: 'pwa-512x512.png',
                                    sizes: '512x512',
                                    type: 'image/png',
                                    purpose: 'any maskable'
                                  }
                                ]
                              }
                            })
  ],
})
