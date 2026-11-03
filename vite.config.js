import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-router")) return "chunk-r";
          if (id.includes("react-dom") || id.includes("/react/")) return "chunk-react";
          if (id.includes("@supabase")) return "chunk-a";
          if (id.includes("axios")) return "chunk-h";
          if (id.includes("react-helmet")) return "chunk-meta";
          return "chunk-v";
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
