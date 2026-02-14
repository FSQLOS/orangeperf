import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default function() {
  return defineConfig({
    base: '/orangeperf/',
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
    ],
    build: {
      chunkSizeWarningLimit: 2000, // On augmente la limite pour être tranquille
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // On met Excel tout seul (le poids lourd)
              if (id.includes('xlsx')) {
                return 'vendor-excel';
              }
              // TOUT le reste des bibliothèques (React, Charts, Lucide) reste ensemble
              // Cela évite les erreurs de "forwardRef" ou "undefined"
              return 'vendor';
            }
          }
        }
      }
    }
  })
}
