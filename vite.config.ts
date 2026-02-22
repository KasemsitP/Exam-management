import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
build: {
    outDir: "../backendExam/client-dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // แยก React และ Router ออกมาเป็นก้อน core
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return '@vendor-core';
            }
            // ที่เหลือให้แยกตามชื่อ package (เช่น axios, lodash)
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
    // ขยับเพดานแจ้งเตือนเป็น 1000kb (เพราะเราสับ chunk แล้ว ไฟล์จะย่อยลงเอง)
    chunkSizeWarningLimit: 1000,
  },
}));
