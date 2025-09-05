import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/', // mode === 'development' ? '/' : '/btcfi-static',
  define: {
    global: 'globalThis',
    'process.env': {},
    'process.platform': '"browser"',
    'process.version': '"18.0.0"',
  },
  optimizeDeps: {
    include: [
      'buffer',
      'bitcoinjs-lib',
      'ecpair',
      'tiny-secp256k1',
      'crypto',
      'stream',
      'util',
      'events',
      'process',
    ],
  },
  server: {
    host: '::',
    port: 8080,
    proxy: {
      '/api-btcfi': {
        target: 'https://jungho.dev',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(
              'Received Response from the Target:',
              proxyRes.statusCode,
              req.url
            );
          });
        },
      },
    },
  },
  plugins: [
    react(),
    wasm(),
    topLevelAwait(),
    nodePolyfills({
      // Bitcoin 관련 라이브러리에 필요한 Node.js 모듈들 포함
      include: [
        'buffer',
        'process',
        'util',
        'stream',
        'events',
        'crypto',
        'path',
        'url',
        'assert',
        'os',
        'constants',
        '_stream_duplex',
        '_stream_passthrough',
        '_stream_readable',
        '_stream_transform',
        '_stream_writable',
      ],
      globals: {
        Buffer: true, // Buffer를 전역 스코프로 인식
        global: true,
        process: true,
      },
      // node: 프로토콜 임포트 지원
      protocolImports: true,
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'static',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].[hash].js`, // JavaScript 파일의 이름 패턴
        chunkFileNames: `assets/[name].[hash].js`, // 비동기 청크 파일의 이름 패턴
        assetFileNames: `assets/[name].[hash].[ext]`, // CSS, 이미지 등의 파일 이름 패턴
        // 기존 btcfi 파일명 패턴 주석처리
        // entryFileNames: `assets/[name].btcfi.js`,
        // chunkFileNames: `assets/[name].btcfi.js`,
        // assetFileNames: `assets/[name].btcfi.[ext]`,
      },
    },
  },
}));
