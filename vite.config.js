import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
                            VitePWA({
                              registerType: 'autoUpdate',
                              manifest: {
                                name: 'Orange Perf',
                                short_name: 'OrangePerf',
                                theme_color: '#FF7900',
                                background_color: '#f4f6fa',
                                display: 'standalone',
                                icons: [
                                  {
                                    src: 'pwa-192x192.png',
                                    sizes: '192x192',
                                    type: 'image/png'
                                  }
                                ]
                              }
                            })
  ]
})
