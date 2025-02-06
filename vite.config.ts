import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const PORT = parseInt(env.PORT || '3000')

  return {
    plugins: [react()],
    server: {
      port: PORT,
      host: true, // Needed for Docker
    },
    preview: {
      port: PORT,
      host: true,
    },
    build: {
      chunkSizeWarningLimit: 1000,
      sourcemap: false, // Disable sourcemaps in production
      minify: 'terser', // Use terser for better minification
      terserOptions: {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true
        }
      },
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
    }
  }
})
