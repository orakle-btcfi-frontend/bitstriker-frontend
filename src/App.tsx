import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { WalletProvider } from '@/contexts/WalletContext';
import Index from './pages/Index';
import Homepage from './pages/Homepage';
import Homepage2 from './pages/Homepage2';
import TradePage from './pages/TradePage';
import TradePage2 from './pages/TradePage2';
import PortfolioPage from './pages/PortfolioPage';
import PortfolioPage2 from './pages/PortfolioPage2';
import MyPage from './pages/MyPage';
import SettingsPage from './pages/SettingsPage';
import ApiTestPage from './pages/ApiTestPage';
import WalletPage from './pages/WalletPage';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

const App = () => {
  const isDev = import.meta.env.DEV;

  // Buffer 폴리필 테스트 (개발 환경에서만)
  if (isDev) {
    console.log('🔧 Buffer 폴리필 테스트:');
    console.log(
      '- globalThis.Buffer 존재:',
      typeof globalThis.Buffer !== 'undefined'
    );
    console.log(
      '- window.Buffer 존재:',
      typeof (window as any).Buffer !== 'undefined'
    );
    console.log('- Buffer 생성 테스트:', Buffer.from('hello').toString('hex'));
    console.log(
      '- process 객체 존재:',
      typeof globalThis.process !== 'undefined'
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Development 환경: 간단한 라우팅 */}
              {isDev ? (
                <>
                  <Route path="/" element={<Homepage />} />
                  <Route path="/home2" element={<Homepage2 />} />
                  <Route path="/trade" element={<TradePage />} />
                  <Route path="/trade2" element={<TradePage2 />} />
                  <Route path="/portfolio" element={<PortfolioPage />} />
                  <Route path="/portfolio2" element={<PortfolioPage2 />} />
                  <Route path="/wallet" element={<WalletPage />} />
                  <Route path="/mypage" element={<MyPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/api-test" element={<ApiTestPage />} />
                  <Route path="*" element={<NotFound />} />
                </>
              ) : (
                <>
                  {/* Production 환경: 루트 경로 사용 */}
                  {/* 기존 /btcfi 경로들 주석처리
                  <Route path="/btcfi" element={<Homepage />} />
                  <Route path="/btcfi/trade" element={<TradePage />} />
                  <Route path="/btcfi/portfolio" element={<PortfolioPage />} />
                  <Route path="/btcfi/wallet" element={<WalletPage />} />
                  <Route path="/btcfi/mypage" element={<MyPage />} />
                  <Route path="/btcfi/settings" element={<SettingsPage />} />
                  <Route path="/btcfi/api-test" element={<ApiTestPage />} />
                  */}

                  {/* 루트 경로로 변경 */}
                  <Route path="/" element={<Homepage />} />
                  <Route path="/home2" element={<Homepage2 />} />
                  <Route path="/trade" element={<TradePage />} />
                  <Route path="/trade2" element={<TradePage2 />} />
                  <Route path="/portfolio" element={<PortfolioPage />} />
                  <Route path="/portfolio2" element={<PortfolioPage2 />} />
                  <Route path="/wallet" element={<WalletPage />} />
                  <Route path="/mypage" element={<MyPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/api-test" element={<ApiTestPage />} />

                  <Route path="*" element={<NotFound />} />
                </>
              )}
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
};

export default App;
