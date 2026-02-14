import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
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
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // On isole uniquement les bibliothèques qui ne changent jamais et qui sont lourdes
          if (id.includes('node_modules')) {
            // Bloc Excel
            if (id.includes('xlsx')) {
              return 'vendor-excel';
            }
            // Bloc Graphiques (on regroupe tout ce qui touche à Chart.js ici)
            if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('chartjs-plugin-datalabels')) {
              return 'vendor-charts';
            }
            // On laisse Vite gérer le reste (React, Lucide, etc.) automatiquement
            // pour éviter les dépendances circulaires.
          }
        }
      }
    }
  }
})
