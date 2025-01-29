import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['three'], // three 모듈 사전 처리 : react의 three 모듈 임포팅 지연에 따른.
  },
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "src/00_core"),
      "@components": path.resolve(__dirname, "src/01_components"),
      "@pages": path.resolve(__dirname, "src/02_pages"),
      three: path.resolve(__dirname, "node_modules/three"), // 명확한 경로 설정
    },
  }
});