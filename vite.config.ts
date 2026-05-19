import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages project site: https://<user>.github.io/BPM-Prototype/
export default defineConfig({
  plugins: [react()],
  base: '/BPM-Prototype/',
});
