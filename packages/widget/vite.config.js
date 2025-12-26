import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry: 'src/index.jsx',
      name: 'VideoWidget',
      fileName: 'video-widget',
      // fileName: 'video-widget-degipro',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        globals: {},
      },
    },
  },
})
