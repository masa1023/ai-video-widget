import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry: 'src/index.jsx',
      name: 'VideoWidget',
      fileName: () => 'embed.js',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        globals: {},
      },
    },
  },
})
