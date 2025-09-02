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
import { useBTCOptions } from '@/hooks/api/useBTCOptions';

interface ExpiryOption {
  label: string;
  days: number;
  expiryDate: string;
  rawExpiry: string; // ISO 형식의 원본 만료일
}

const TradePage = () => {
  // 실제 BTC 가격 데이터 가져오기
  const {
    data: priceData,
    isLoading: isPriceLoading,
    error: priceError,
  } = useBTCPriceChange();

  // 옵션 데이터 가져오기 (만료일 정보를 얻기 위해)
  const { data: optionsData } = useBTCOptions({ limit: 50 });

  // 가격 데이터가 있으면 사용하고, 없으면 기본값 사용
  const currentPrice = priceData?.price || 121608.0;
  const priceChange = priceData?.change24h || 0.85;

  // 백엔드 옵션 데이터에서 고유한 만료일들을 추출하여 만료일 옵션 생성
  const expiryOptions: ExpiryOption[] = useMemo(() => {
    if (!optionsData || optionsData.length === 0) {
      // 기본값 (백엔드 데이터가 없을 때)
      return [
        {
          label: 'Loading...',
          days: 1,
          expiryDate: 'Loading...',
          rawExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
    }

    // 고유한 만료일들을 추출하고 정렬
    const uniqueExpiries = Array.from(
      new Set(optionsData.map(option => option.expiry))
    ).sort();

    const now = new Date();

    return uniqueExpiries.slice(0, 6).map(expiry => {
      const expiryDate = new Date(expiry);
      const diffDays = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 라벨 생성
      let label: string;
      if (diffDays <= 0) {
        label = 'Expired';
      } else if (diffDays === 1) {
        label = 'Tomorrow';
      } else if (diffDays <= 7) {
        label = `${diffDays}d`;
      } else if (diffDays <= 30) {
        label = `${Math.ceil(diffDays / 7)}w`;
      } else {
        label = `${Math.ceil(diffDays / 30)}m`;
      }

      // 포맷된 만료일 (한국시간 기준)
      const formattedExpiry = expiryDate.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
      });

      return {
        label,
        days: diffDays,
        expiryDate: formattedExpiry,
        rawExpiry: expiry,
      };
    });
  }, [optionsData]);

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

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Price Display and Expiry Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Current Price Display */}
          <div className="lg:col-span-1">
            <Card className="glass-card p-6">
              <div className="text-center">
                {isPriceLoading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--trading-yellow))]" />
                    <div className="text-lg text-muted-foreground">
                      가격 정보 로딩 중...
                    </div>
                  </div>
                ) : priceError ? (
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-3 text-[hsl(var(--trading-yellow))]">
                      ${currentPrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-red-500 mb-2">
                      실시간 가격 업데이트 불가
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-4xl font-bold mb-3 text-[hsl(var(--trading-yellow))]">
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
                <Badge variant="outline" className="mb-4 text-xs">
                  Current Price
                </Badge>
                <PriceChart currentPrice={currentPrice} />
                <div className="text-xs text-muted-foreground mt-2">
                  24H Chart
                </div>
              </div>
            </Card>
          </div>

          {/* Expiry Selection */}
          <div className="lg:col-span-3">
            <Card className="glass-card p-6 mb-6">
              <div className="grid grid-cols-5 gap-4">
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
                    <div className="text-center space-y-3">
                      <ExpiryCountdown
                        expiryDate={selectedExpiry.rawExpiry}
                        compact={false}
                        showBadge={false}
                      />
                      <div className="text-lg text-muted-foreground">
                        만료일:{' '}
                        {new Date(selectedExpiry.rawExpiry).toLocaleDateString(
                          'ko-KR',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'short',
                          }
                        )}{' '}
                        {new Date(selectedExpiry.rawExpiry).toLocaleTimeString(
                          'ko-KR',
                          {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          }
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-muted-foreground">
                        만료일 로딩 중...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Options Trading Interface */}
            <Card className="glass-card shadow-xl overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-semibold">Options Trading</h2>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <Badge variant="outline" className="px-3 py-1">
                      BTC Price: ${currentPrice.toFixed(1)}
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1">
                      ATM Vol: 34.3%
                    </Badge>
                  </div>
                </div>

                {/* Unified Options Table */}
                <div className="mb-4">
                  <div className="grid grid-cols-7 gap-4 mb-4 px-4">
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
      />
    </div>
  );
};

export default TradePage;
