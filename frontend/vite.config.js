import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // Listen on 0.0.0.0
    port: 3000,        // Force port 3000 to match Docker
    strictPort: true,  // Fail if port 3000 is busy
    allowedHosts: [
      "cisd.cisdportal.online", 
      "apicisd.cisdportal.online", 
      "localhost"
    ],
    proxy: {
      "/api": {
        target: "http://neierp_backend:5000",
        changeOrigin: true,
        secure: false,
      },
    },
  }
})
