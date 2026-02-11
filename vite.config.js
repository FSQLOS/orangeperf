import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
                            base: '/orangeperf/',  // <--- C'est ici que ça se joue
})
