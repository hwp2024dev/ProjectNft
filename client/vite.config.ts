import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "src/00_core"),
      "@components": path.resolve(__dirname, "src/01_components"),
      "@pages": path.resolve(__dirname, "src/02_pages"),
      "@assets": path.resolve(__dirname, "src/03_assets"),
      "@types": path.resolve(__dirname, "src/@types"),
    },
  },
});