import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // N'oublie pas de vérifier que le nom du dépôt est correct
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
    // On augmente un peu la limite pour supprimer l'alerte
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // C'est ici qu'on sépare les grosses bibliothèques
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) {
              return 'vendor-excel'; // Met xlsx dans son propre fichier
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts'; // Met les graphiques à part
            }
            return 'vendor'; // Le reste des bibliothèques (React, etc.)
          }
        }
      }
    }
  }
})
