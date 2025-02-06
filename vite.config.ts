import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          cardDrawer: ['./src/utils/CardDrawer.ts'],
          langUi: ['./src/assets/lang.ui.json'],
          langCardMeta: ['./src/assets/lang.card_meta.json'],
          ygoproData: ['./src/assets/ygo/card_data.json'],
        },
      },
    },
    sourcemap: false, // Disable sourcemaps in production
    minify: 'terser', // Use terser for better minification
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
})
