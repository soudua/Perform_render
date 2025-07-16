import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Increase chunk size warning limit to reduce noise
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        // Split chunks to improve loading performance
        manualChunks: {
          // Vendor libraries
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'charts-vendor': ['@mui/x-charts', '@mui/x-date-pickers'],
          'mui-vendor': ['@mui/material', '@mui/joy', '@mui/base'],
          'utils-vendor': ['axios', 'date-fns'],
          'd3-vendor': ['d3-time', 'd3-interpolate'],
        }
      }
    }
  }
})
