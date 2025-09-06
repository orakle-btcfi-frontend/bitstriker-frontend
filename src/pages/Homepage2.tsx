import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Bitcoin,
  DollarSign,
  Users,
  Activity,
  Loader2,
  BarChart3,
  Target,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useBTCPriceChange } from '@/hooks/api/useBTCPrice';
import {
  useNewOptionsTable,
  useTopBanner,
  useMarketHighlights,
  useTopGainers,
  useTopVolume,
  useNewApiHealth,
  usePortfolioDelta,
} from '@/hooks/api/useNewBTCOptions';
import { useMemo } from 'react';

const Homepage2 = () => {
  // 실시간 BTC 가격 데이터
  const {
    data: priceData,
    isLoading: isPriceLoading,
    error: priceError,
  } = useBTCPriceChange();

  // 새로운 API 데이터들
  const { data: healthData } = useNewApiHealth();
  const { data: newOptionsData } = useNewOptionsTable();
  const { data: topBannerData } = useTopBanner();
  const { data: marketHighlights } = useMarketHighlights();
  const { data: topGainers } = useTopGainers();
  const { data: topVolume } = useTopVolume();
  const { data: portfolioDelta } = usePortfolioDelta();

  // 현재 BTC 가격 (기본값 사용 가능)
  const currentPrice = priceData?.price || 114682;

  // 시장 하이라이트 데이터 변환
  const marketData = useMemo(() => {
    if (!marketHighlights || marketHighlights.length === 0) {
      return [];
    }

    return marketHighlights.slice(0, 6).map(highlight => ({
      symbol: highlight.product_symbol,
      expiry: highlight.expire,
      premium: `${highlight.volume_24hr.toFixed(4)} BTC`,
      change: `${highlight.price_change_24hr_percent >= 0 ? '+' : ''}${highlight.price_change_24hr_percent.toFixed(1)}%`,
      type: highlight.side === 'Call' ? 'C' : 'P',
      color:
        highlight.price_change_24hr_percent >= 0
          ? 'text-[hsl(var(--trading-green))]'
          : 'text-[hsl(var(--trading-red))]',
    }));
  }, [marketHighlights]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-2xl">
              <Bitcoin className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-6xl font-bold mb-6 text-foreground">
            BTC Native Layer 1 Exchange
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Trade Bitcoin options directly on Layer 1 with institutional-grade
            infrastructure
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link to="/trade2">
              <Button size="lg" className="px-8 py-3 text-lg font-semibold">
                Start Trading
              </Button>
            </Link>
            <Link to="/portfolio2">
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-3 text-lg font-semibold"
              >
                View Portfolio
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Current BTC Price */}
          <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[hsl(var(--trading-yellow))]/10 rounded-2xl flex items-center justify-center">
                  <Bitcoin className="w-6 h-6 text-[hsl(var(--trading-yellow))]" />
                </div>
                <Badge variant="outline" className="text-xs">
                  Live
                </Badge>
              </div>
              <div className="space-y-2">
                {isPriceLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Loading...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-[hsl(var(--trading-yellow))]">
                      ${currentPrice.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      BTC/USD Price
                    </div>
                    {priceData && (
                      <div
                        className={`text-sm font-semibold ${
                          priceData.change24h >= 0
                            ? 'text-[hsl(var(--trading-green))]'
                            : 'text-[hsl(var(--trading-red))]'
                        }`}
                      >
                        {priceData.change24h >= 0 ? '+' : ''}
                        {priceData.change24h.toFixed(2)}%
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Card>

          {/* 24h Volume */}
          <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700"
                >
                  24H
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">
                  ₿{topBannerData?.volume_24hr.toFixed(4) || '0.0000'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Trading Volume
                </div>
              </div>
            </div>
          </Card>

          {/* Open Interest */}
          <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700"
                >
                  OI
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">
                  ${topBannerData?.open_interest_usd.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Open Interest
                </div>
              </div>
            </div>
          </Card>

          {/* Portfolio Delta */}
          <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-500" />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-purple-50 text-purple-700"
                >
                  Δ
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-purple-600">
                  {portfolioDelta?.toFixed(6) || '0.000000'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Portfolio Delta
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Market Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Top Gainers */}
          <Card className="glass-card shadow-lg">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-[hsl(var(--trading-green))]/10 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[hsl(var(--trading-green))]" />
                </div>
                <h3 className="text-lg font-semibold">Top Gainers</h3>
              </div>

              <div className="space-y-3">
                {topGainers && topGainers.length > 0 ? (
                  topGainers.slice(0, 5).map((gainer, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            gainer.side === 'Call'
                              ? 'bg-[hsl(var(--trading-green))]/10 text-[hsl(var(--trading-green))] border-[hsl(var(--trading-green))]/30'
                              : 'bg-[hsl(var(--trading-red))]/10 text-[hsl(var(--trading-red))] border-[hsl(var(--trading-red))]/30'
                          }`}
                        >
                          {gainer.side}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">
                            {gainer.product_symbol}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Strike: ${gainer.strike_price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-[hsl(var(--trading-green))]">
                          +{gainer.change_24hr_percent.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ₿{gainer.last_price.toFixed(8)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-sm">Loading data...</div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Top Volume */}
          <Card className="glass-card shadow-lg">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold">Top Volume</h3>
              </div>

              <div className="space-y-3">
                {topVolume && topVolume.length > 0 ? (
                  topVolume.slice(0, 5).map((volume, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            volume.side === 'Call'
                              ? 'bg-[hsl(var(--trading-green))]/10 text-[hsl(var(--trading-green))] border-[hsl(var(--trading-green))]/30'
                              : 'bg-[hsl(var(--trading-red))]/10 text-[hsl(var(--trading-red))] border-[hsl(var(--trading-red))]/30'
                          }`}
                        >
                          {volume.side}
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">
                            {volume.product_symbol}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Strike: ${volume.strike_price.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600">
                          ${volume.volume_usd.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ₿{volume.last_price.toFixed(8)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-sm">Loading data...</div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Market Highlights Table */}
        {marketData.length > 0 && (
          <Card className="glass-card shadow-lg mb-12">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Market Highlights</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/20">
                      <th className="text-left py-3 px-4 font-semibold text-sm">
                        Symbol
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">
                        Type
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-sm">
                        Expiry
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-sm">
                        Volume
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-sm">
                        24h Change
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketData.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-border/10 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="font-medium">{item.symbol}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              item.type === 'C'
                                ? 'bg-[hsl(var(--trading-green))]/10 text-[hsl(var(--trading-green))] border-[hsl(var(--trading-green))]/30'
                                : 'bg-[hsl(var(--trading-red))]/10 text-[hsl(var(--trading-red))] border-[hsl(var(--trading-red))]/30'
                            }`}
                          >
                            {item.type === 'C' ? 'Call' : 'Put'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {item.expiry}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          {item.premium}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-semibold ${item.color}`}
                        >
                          {item.change}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}

        {/* CTA Section */}
        <div className="text-center">
          <Card className="glass-card shadow-xl p-12 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">
                Start Trading Bitcoin Options
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Experience professional options trading with accurate pricing
                calculations and risk management systems based on the
                Black-Scholes model.
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Link to="/trade2">
                  <Button size="lg" className="px-8 py-3 text-lg font-semibold">
                    Trade Now
                  </Button>
                </Link>
                <Link to="/portfolio2">
                  <Button
                    variant="outline"
                    size="lg"
                    className="px-8 py-3 text-lg font-semibold"
                  >
                    View Portfolio
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Homepage2;
