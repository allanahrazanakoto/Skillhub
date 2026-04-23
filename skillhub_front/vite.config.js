import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// En dev, /api et /storage sont redirigés vers le backend (ex. Laravel sur :8000)
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.js',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      // En développement local, /auth-api redirige vers Spring Boot :8080
      // Cela évite les problèmes CORS entre le navigateur et Spring Boot
      '/auth-api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // On enlève le préfixe /auth-api avant d'envoyer à Spring Boot
        // /auth-api/api/auth/login → /api/auth/login sur Spring Boot
        rewrite: (path) => path.replace(/^\/auth-api/, ''),
      },
      '/storage': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
