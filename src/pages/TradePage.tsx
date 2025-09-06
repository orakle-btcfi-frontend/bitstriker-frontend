import { useState, useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, X, Loader2 } from 'lucide-react';
import { useBTCPriceChange } from '@/hooks/api/useBTCPrice';
import { OptionsTable } from '@/components/OptionsTable';
import { TradingModal } from '@/components/TradingModal';
import { PriceChart } from '@/components/PriceChart';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ExpiryCountdown } from '@/components/ExpiryCountdown';
import { RealTimeCountdown } from '@/components/RealTimeCountdown';
import {
  useNewOptionsTable,
  useTopBanner,
  usePortfolioDelta,
  useNewApiHealth,
} from '@/hooks/api/useNewBTCOptions';

interface ExpiryOption {
  label: string;
  days: number;
  expiryDate: string;
  rawExpiry: string; // "1d", "2d", "3d", "5d", "7d" 형식
}

const TradePage = () => {
  // 실제 BTC 가격 데이터 가져오기
  const {
    data: priceData,
    isLoading: isPriceLoading,
    error: priceError,
  } = useBTCPriceChange();

  // 새로운 API 데이터들
  const { data: healthData } = useNewApiHealth();
  const { data: newOptionsData } = useNewOptionsTable();
  const { data: topBannerData } = useTopBanner();
  const { data: portfolioDelta } = usePortfolioDelta();

  // 가격 데이터가 있으면 사용하고, 없으면 기본값 사용
  const currentPrice = priceData?.price || 121608.0;
  const priceChange = priceData?.change24h || 0.85;

  // 새로운 API에서 고유한 만료일들을 추출하여 만료일 옵션 생성
  const expiryOptions: ExpiryOption[] = useMemo(() => {
    if (!newOptionsData || newOptionsData.length === 0) {
      // 기본값 (새로운 API 데이터가 없을 때)
      return [
        {
          label: 'Loading...',
          days: 1,
          expiryDate: 'Loading...',
          rawExpiry: '1d',
        },
      ];
    }

    // 고유한 만료일들을 추출하고 정렬
    const uniqueExpiries = Array.from(
      new Set(newOptionsData.map(option => option.expire))
    ).sort((a, b) => {
      const daysA = parseInt(a.replace('d', ''));
      const daysB = parseInt(b.replace('d', ''));
      return daysA - daysB;
    });

    return uniqueExpiries.map(expire => {
      const days = parseInt(expire.replace('d', ''));

      // 라벨 생성
      let label: string;
      if (days === 1) {
        label = 'Tomorrow';
      } else if (days <= 7) {
        label = `${days}d`;
      } else if (days <= 30) {
        label = `${Math.ceil(days / 7)}w`;
      } else {
        label = `${Math.ceil(days / 30)}m`;
      }

      // 포맷된 만료일
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      return {
        label,
        days,
        expiryDate: formattedExpiry,
        rawExpiry: expire,
      };
    });
  }, [newOptionsData]);

  const [selectedExpiry, setSelectedExpiry] = useState<ExpiryOption | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<any>(null);

  // 첫 번째 유효한 만료일 옵션을 기본값으로 설정
  useMemo(() => {
    if (expiryOptions.length > 0 && expiryOptions[0].label !== 'Loading...') {
      setSelectedExpiry(expiryOptions[0]);
    }
  }, [expiryOptions]);

  const handleOptionClick = (option: any) => {
    setSelectedOption(option);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOption(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Price Display and Expiry Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 mb-6 lg:mb-8">
          {/* Current Price Display */}
          <div className="lg:col-span-1">
            <Card className="glass-card p-6">
              <div className="text-center">
                {isPriceLoading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--trading-yellow))]" />
                    <div className="text-lg text-muted-foreground">
                      Loading price data...
                    </div>
                  </div>
                ) : priceError ? (
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-3 text-[hsl(var(--trading-yellow))]">
                      ${currentPrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-red-500 mb-2">
                      Real-time price update unavailable
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="text-4xl font-bold mb-3 text-[hsl(var(--trading-yellow))] cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() =>
                        window.open(
                          'https://tradingview.com/chart/?symbol=CRYPTO%3ABTCUSD',
                          '_blank'
                        )
                      }
                      title="View on TradingView"
                    >
                      ${currentPrice.toLocaleString()}
                    </div>
                    <div className="text-lg font-semibold text-muted-foreground mb-2">
                      BTCUSD
                    </div>
                    <div
                      className={`text-base font-semibold mb-4 ${
                        priceChange >= 0 ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {priceChange >= 0 ? '+' : ''}
                      {priceChange.toFixed(2)}%
                    </div>
                  </>
                )}
                <Badge
                  variant="outline"
                  className="mb-4 text-xs cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() =>
                    window.open(
                      'https://tradingview.com/chart/?symbol=CRYPTO%3ABTCUSD',
                      '_blank'
                    )
                  }
                  title="View on TradingView"
                >
                  Current Price
                </Badge>
                <div
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() =>
                    window.open(
                      'https://tradingview.com/chart/?symbol=CRYPTO%3ABTCUSD',
                      '_blank'
                    )
                  }
                  title="View full chart on TradingView"
                >
                  <PriceChart currentPrice={currentPrice} />
                  <div className="text-xs text-muted-foreground mt-2">
                    24H Chart (Click to view full chart)
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Expiry Selection */}
          <div className="lg:col-span-4">
            <Card className="glass-card p-4 lg:p-6 mb-4 lg:mb-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 lg:gap-4">
                {expiryOptions.map(expiry => (
                  <Button
                    key={expiry.label}
                    variant={
                      selectedExpiry?.label === expiry.label
                        ? 'default'
                        : 'outline'
                    }
                    className={`p-4 h-auto flex-col space-y-2 transition-all hover:scale-105 ${
                      selectedExpiry?.label === expiry.label
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedExpiry(expiry)}
                  >
                    <div className="font-semibold text-base">
                      {expiry.label}
                    </div>
                    <div className="text-sm">Exp: {expiry.expiryDate}</div>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Time to Expiry Display */}
            <Card className="glass-card p-8 mb-6">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <Clock className="w-10 h-10 text-blue-500" />
                  <h2 className="text-4xl font-bold text-foreground">
                    Time to Expiry
                  </h2>
                </div>
                <div className="mb-4">
                  {selectedExpiry ? (
                    <div className="space-y-6">
                      <RealTimeCountdown
                        targetDate={(() => {
                          // 현재 시간에서 정확한 만료일 계산
                          const now = new Date();
                          const expiry = new Date(now);
                          expiry.setDate(now.getDate() + selectedExpiry.days);
                          // 만료일의 특정 시간으로 설정 (예: 오후 4시)
                          expiry.setHours(16, 0, 0, 0);
                          return expiry;
                        })()}
                      />
                      <div className="text-lg text-muted-foreground">
                        Expiry: {selectedExpiry.expiryDate} (
                        {selectedExpiry.rawExpiry})
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-muted-foreground">
                        Loading expiry dates...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Options Trading Interface */}
            <Card className="glass-card shadow-xl overflow-hidden">
              <div className="p-4 lg:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-semibold">Options Trading</h2>
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800 border-blue-300"
                    >
                      {newOptionsData?.length || 0} Options Available
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <Badge variant="outline" className="px-3 py-1">
                      BTC Price: ${currentPrice.toFixed(1)}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      Premium in BTC
                    </Badge>
                  </div>
                </div>

                {/* Unified Options Table */}
                <div className="mb-4">
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-7 gap-2 mb-4 px-2">
                      <div className="col-span-3 flex items-center justify-center space-x-2">
                        <TrendingUp className="w-5 h-5 text-[hsl(var(--trading-green))]" />
                        <h3 className="text-lg font-semibold text-[hsl(var(--trading-green))]">
                          Calls
                        </h3>
                      </div>
                      <div className="col-span-1 flex items-center justify-center">
                        <h3 className="text-lg font-semibold">Strike</h3>
                      </div>
                      <div className="col-span-3 flex items-center justify-center space-x-2">
                        <TrendingDown className="w-5 h-5 text-[hsl(var(--trading-red))]" />
                        <h3 className="text-lg font-semibold text-[hsl(var(--trading-red))]">
                          Puts
                        </h3>
                      </div>
                    </div>
                    <OptionsTable
                      currentPrice={currentPrice}
                      onOptionClick={handleOptionClick}
                      selectedExpiry={selectedExpiry?.rawExpiry}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Trading Modal */}
      <TradingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        option={selectedOption}
        currentPrice={currentPrice}
        symbol="BTCUSD"
        selectedExpiry={selectedExpiry?.rawExpiry}
      />
    </div>
  );
};

export default TradePage;
