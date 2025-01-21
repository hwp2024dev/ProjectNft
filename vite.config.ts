import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

//tsconfig.ts와 같은경로로 설정해준다.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@core": path.resolve(__dirname, "src/00_core"),
      "@components": path.resolve(__dirname, "src/01_components"),
      "@pages": path.resolve(__dirname, "src/02_pages"),
    }
  }
});