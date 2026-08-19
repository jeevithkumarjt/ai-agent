import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Library mode: one self-contained bundle that registers
// <ai-agent-widget> as a custom element. Style.css is auto-emitted as a sibling.
// Meant to be published to npm/jsDelivr with version pinning.
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
      output: {
        // Preserve module format for tree-shaking and npm consumption
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
