import { createRoot } from 'react-dom/client';
import { Buffer } from 'buffer';
import App from './App.tsx';
import './index.css';

// Buffer를 전역 스코프에 추가 (브라우저 호환성을 위해)
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}
globalThis.Buffer = Buffer;

createRoot(document.getElementById('root')!).render(<App />);
