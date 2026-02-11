import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/orangeperf/', // IMPORTANT : Mets le nom exact de ton dépôt GitHub ici
})
