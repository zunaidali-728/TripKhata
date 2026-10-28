import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons'
          }
          if (id.includes('node_modules/zod/')) {
            return 'vendor-zod'
          }
        },
      },
      onwarn(warning, defaultHandler) {
        // Zod v4 includes doc comments mentioning `@__PURE__` which Rollup notes it removes.
        // Ignore this specific harmless dependency annotation warning while forwarding all other warnings.
        if (
          warning.code === 'INVALID_ANNOTATION' &&
          (warning.id?.includes('node_modules/zod') || warning.loc?.file?.includes('node_modules/zod'))
        ) {
          return
        }
        defaultHandler(warning)
      },
    },
  },
  server: {
    port: 5173,
  },
})
