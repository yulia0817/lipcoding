import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Tauri 플러그인은 데스크톱(Tauri) 런타임에서만 동적 import 됩니다.
    // 브라우저 빌드에서는 외부 모듈로 처리해 정적 해석 실패를 막습니다(런타임에선 hasTauri() 가드).
    rollupOptions: {
      external: [/^@tauri-apps\//],
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000'
    }
  }
})
