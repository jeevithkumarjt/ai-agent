import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Library mode: one self-contained bundle (dist/agent-widget.js) that registers
// <ai-agent-widget> as a custom element. Style.css is auto-emitted as a sibling.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/main.jsx',
      name: 'AgentWidget',
      fileName: 'agent-widget',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
    },
  },
})
