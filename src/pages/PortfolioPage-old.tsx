import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Clock, Loader2 } from 'lucide-react';
import {
  useUserTradeHistories,
  useUserPortfolios,
  calculatePortfolioStats,
} from '@/hooks/api/useUserData';
import { useBTCPriceChange } from '@/hooks/api/useBTCPrice';
import { useActiveBTCOptions } from '@/hooks/api/useBTCOptions';
import { ExpiryCountdown } from '@/components/ExpiryCountdown';
import { useMemo } from 'react';

interface TreeMapItem {
  name: string;
  value: number;
  category: string;
  color: string;
  children?: TreeMapItem[];
}

const PortfolioPage = () => {
  // 실시간 데이터 가져오기
  const { data: priceData } = useBTCPriceChange();
  const { data: activeOptionsData } = useActiveBTCOptions();

  // 사용자 데이터 가져오기 (임시로 userId 1 사용)
  const userId = 1;
  const { data: tradeHistories = [], isLoading: isTradesLoading } =
    useUserTradeHistories({ userId, limit: 50 });

  const { data: portfolios = [], isLoading: isPortfoliosLoading } =
    useUserPortfolios({ userId });

  // 포트폴리오 통계 계산
  const portfolioStats = useMemo(() => {
    if (!tradeHistories || !portfolios) {
      // 기본값 반환
      return {
        totalValue: 1000000,
        activePositions: 12,
        todayPnL: 5240,
        totalPnL: 24500,
        totalTrades: 47,
        returnRate: 12.4,
      };
    }
    return calculatePortfolioStats(portfolios, tradeHistories);
  }, [portfolios, tradeHistories]);

  // BTC 옵션 기반 포트폴리오 데이터 생성
  const portfolioData: TreeMapItem[] = useMemo(() => {
    if (!activeOptionsData) {
      // 기본 데이터
      return [
        {
          name: 'BTC Calls',
          value: 450000,
          category: 'calls',
          color: 'bg-green-500',
          children: [
            {
              name: 'ITM Calls',
              value: 250000,
              category: 'calls',
              color: 'bg-green-600',
            },
            {
              name: 'ATM Calls',
              value: 150000,
              category: 'calls',
              color: 'bg-green-500',
            },
            {
              name: 'OTM Calls',
              value: 50000,
              category: 'calls',
              color: 'bg-green-400',
            },
          ],
        },
        {
          name: 'BTC Puts',
          value: 350000,
          category: 'puts',
          color: 'bg-red-500',
          children: [
            {
              name: 'ITM Puts',
              value: 180000,
              category: 'puts',
              color: 'bg-red-600',
            },
            {
              name: 'ATM Puts',
              value: 120000,
              category: 'puts',
              color: 'bg-red-500',
            },
            {
              name: 'OTM Puts',
              value: 50000,
              category: 'puts',
              color: 'bg-red-400',
            },
          ],
        },
      ];
    }

    // 실제 옵션 데이터 기반으로 포트폴리오 구성
    const currentPrice = priceData?.price || 114682;

    const callOptions = activeOptionsData
      .filter(option => option.call_premium > option.put_premium)
      .slice(0, 10);

    const putOptions = activeOptionsData
      .filter(option => option.put_premium > option.call_premium)
      .slice(0, 10);

    const callValue = callOptions.reduce(
      (sum, option) => sum + option.call_premium * 100,
      0
    );
    const putValue = putOptions.reduce(
      (sum, option) => sum + option.put_premium * 100,
      0
    );

    return [
      {
        name: 'BTC Call Options',
        value: callValue,
        category: 'calls',
        color: 'bg-green-500',
        children: callOptions.slice(0, 3).map((option, index) => ({
          name: `$${option.strike} Call`,
          value: option.call_premium * 100,
          category: 'calls',
          color: `bg-green-${500 + index * 100}`,
        })),
      },
      {
        name: 'BTC Put Options',
        value: putValue,
        category: 'puts',
        color: 'bg-red-500',
        children: putOptions.slice(0, 3).map((option, index) => ({
          name: `$${option.strike} Put`,
          value: option.put_premium * 100,
          category: 'puts',
          color: `bg-red-${500 + index * 100}`,
        })),
      },
      {
        name: 'Long Term Options',
        value: callValue * 0.3,
        category: 'long-term',
        color: 'bg-indigo-500',
        children: [
          {
            name: 'Q1 Calls',
            value: callValue * 0.1,
            category: 'long-term',
            color: 'bg-indigo-600',
          },
          {
            name: 'Q2 Calls',
            value: callValue * 0.1,
            category: 'long-term',
            color: 'bg-indigo-500',
          },
          {
            name: 'Q3+ Calls',
            value: callValue * 0.1,
            category: 'long-term',
            color: 'bg-indigo-400',
          },
        ],
      },
      {
        name: 'Short Term Options',
        value: putValue * 0.4,
        category: 'short-term',
        color: 'bg-red-500',
        children: [
          {
            name: 'Weekly Puts',
            value: putValue * 0.2,
            category: 'short-term',
            color: 'bg-red-600',
          },
          {
            name: 'Monthly Puts',
            value: putValue * 0.2,
            category: 'short-term',
            color: 'bg-red-500',
          },
        ],
      },
      {
        name: 'High IV Options',
        value: (callValue + putValue) * 0.15,
        category: 'high-iv',
        color: 'bg-yellow-500',
        children: [
          {
            name: 'Event Driven',
            value: (callValue + putValue) * 0.08,
            category: 'high-iv',
            color: 'bg-yellow-400',
          },
          {
            name: 'Volatility Play',
            value: (callValue + putValue) * 0.07,
            category: 'high-iv',
            color: 'bg-yellow-500',
          },
        ],
      },
      {
        name: 'Spread Strategies',
        value: (callValue + putValue) * 0.2,
        category: 'spreads',
        color: 'bg-cyan-500',
        children: [
          {
            name: 'Bull Spreads',
            value: (callValue + putValue) * 0.12,
            category: 'spreads',
            color: 'bg-cyan-600',
          },
          {
            name: 'Bear Spreads',
            value: (callValue + putValue) * 0.08,
            category: 'spreads',
            color: 'bg-cyan-500',
          },
        ],
      },
    ];
  }, [activeOptionsData, priceData]);

  const totalValue = portfolioData.reduce((sum, item) => sum + item.value, 0);

  const getItemSize = (value: number) => {
    const percentage = (value / totalValue) * 100;
    return {
      width: `${Math.max(percentage * 2, 15)}%`,
      height: `${Math.max(percentage * 1.5, 100)}px`,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Portfolio Tree Map
          </h1>
          <p className="text-lg text-muted-foreground">
            Your crypto options portfolio organized by asset categories
          </p>
        </div>

        {/* Portfolio Stats - 실시간 데이터 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1 pt-1">
              Total Portfolio Value
            </h3>
            {isPortfoliosLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <p className="text-3xl font-bold text-foreground text-center">
                $
                {Math.max(
                  totalValue,
                  portfolioStats.totalValue
                ).toLocaleString()}
              </p>
            )}
          </Card>
          <Card className="glass-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1 pt-1">
              Active Positions
            </h3>
            {isPortfoliosLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <p className="text-3xl font-bold text-foreground text-center">
                {portfolioStats.activePositions}
              </p>
            )}
          </Card>
          <Card className="glass-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1 pt-1">
              Today's P&L
            </h3>
            {isTradesLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <p
                className={`text-3xl font-bold text-center ${
                  portfolioStats.todayPnL >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {portfolioStats.todayPnL >= 0 ? '+' : ''}$
                {portfolioStats.todayPnL.toLocaleString()}
              </p>
            )}
          </Card>
          <Card className="glass-card p-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-1 pt-1">
              Total P&L
            </h3>
            {isTradesLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : (
              <p
                className={`text-3xl font-bold text-center ${
                  portfolioStats.totalPnL >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}
              >
                {portfolioStats.totalPnL >= 0 ? '+' : ''}$
                {portfolioStats.totalPnL.toLocaleString()}
              </p>
            )}
          </Card>
        </div>

        {/* Tree Map */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">
            Asset Distribution
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main categories in a flexible grid */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Layer 1 - Largest */}
                <div className="col-span-2">
                  <Card className="bg-blue-500/20 border-blue-500/30 p-6 h-48">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">
                        {portfolioData[0]?.name || 'BTC Calls'}
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-blue-500/20 text-blue-300 border-blue-400"
                      >
                        ${portfolioData[0]?.value?.toLocaleString() || '0'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 h-24">
                      {portfolioData[0]?.children?.map((child, index) => (
                        <div
                          key={index}
                          className={`${
                            child.color
                          }/20 border ${child.color.replace(
                            'bg-',
                            'border-'
                          )}/30 rounded p-2 flex flex-col justify-center items-center`}
                        >
                          <div className="text-sm font-semibold text-white">
                            {child.name}
                          </div>
                          <div className="text-xs text-gray-300">
                            ${(child.value / 1000).toFixed(0)}k
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Layer 2 */}
                <div>
                  <Card className="bg-green-500/20 border-green-500/30 p-4 h-36">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-white">
                        {portfolioData[1]?.name || 'BTC Puts'}
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-green-500/20 text-green-300 border-green-400 text-xs"
                      >
                        ${portfolioData[1]?.value?.toLocaleString() || '0'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {portfolioData[1]?.children?.map((child, index) => (
                        <div key={index} className="text-xs text-gray-300">
                          {child.name}: ${(child.value / 1000).toFixed(0)}k
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* DeFi */}
                <div>
                  <Card className="bg-indigo-500/20 border-indigo-500/30 p-4 h-36">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-white">
                        {portfolioData[2]?.name || 'Long Term'}
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-indigo-500/20 text-indigo-300 border-indigo-400 text-xs"
                      >
                        ${portfolioData[2]?.value?.toLocaleString() || '0'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {portfolioData[2]?.children?.map((child, index) => (
                        <div key={index} className="text-xs text-gray-300">
                          {child.name}: ${(child.value / 1000).toFixed(0)}k
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* RWA */}
                <Card className="bg-red-500/20 border-red-500/30 p-4 h-28">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-white">
                      {portfolioData[3]?.name || 'Short Term'}
                    </h3>
                    <Badge
                      variant="outline"
                      className="bg-red-500/20 text-red-300 border-red-400 text-xs"
                    >
                      ${portfolioData[3]?.value?.toLocaleString() || '0'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {portfolioData[3]?.children?.map((child, index) => (
                      <div key={index} className="text-xs text-gray-300">
                        {child.name}: ${(child.value / 1000).toFixed(0)}k
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Memecoins */}
                <Card className="bg-yellow-500/20 border-yellow-500/30 p-4 h-28">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-white">
                      {portfolioData[4]?.name || 'High IV'}
                    </h3>
                    <Badge
                      variant="outline"
                      className="bg-yellow-500/20 text-yellow-300 border-yellow-400 text-xs"
                    >
                      ${portfolioData[4]?.value?.toLocaleString() || '0'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {portfolioData[4]?.children?.map((child, index) => (
                      <div key={index} className="text-xs text-gray-300">
                        {child.name}: ${(child.value / 1000).toFixed(0)}k
                      </div>
                    ))}
                  </div>
                </Card>

                {/* AI Tokens */}
                <Card className="bg-cyan-500/20 border-cyan-500/30 p-4 h-28">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-white">
                      {portfolioData[5]?.name || 'Spreads'}
                    </h3>
                    <Badge
                      variant="outline"
                      className="bg-cyan-500/20 text-cyan-300 border-cyan-400 text-xs"
                    >
                      ${portfolioData[5]?.value?.toLocaleString() || '0'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {portfolioData[5]?.children?.map((child, index) => (
                      <div key={index} className="text-xs text-gray-300">
                        {child.name}: ${(child.value / 1000).toFixed(0)}k
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Portfolio breakdown */}
            <div className="space-y-4">
              <Card className="glass-card p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Category Breakdown
                </h3>
                <div className="space-y-3">
                  {portfolioData.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-3 h-3 rounded ${item.color}/60`}
                        ></div>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          ${item.value.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {((item.value / totalValue) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="glass-card p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Recent Transactions
                </h3>
                <div className="space-y-3">
                  {isTradesLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">
                        거래 내역 로딩 중...
                      </span>
                    </div>
                  ) : tradeHistories.length > 0 ? (
                    tradeHistories.slice(0, 3).map((trade, index) => (
                      <div
                        key={trade.id || index}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {trade.trade_type === 'buy' ? 'Bought' : 'Sold'}{' '}
                          Option
                        </span>
                        <span
                          className={`${
                            trade.trade_type === 'buy'
                              ? 'text-[hsl(var(--trading-red))]'
                              : 'text-[hsl(var(--trading-green))]'
                          }`}
                        >
                          {trade.trade_type === 'buy' ? '-' : '+'}$
                          {trade.total_value.toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center p-4">
                      거래 내역이 없습니다
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </Card>

        {/* Account Info & Trading Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 mb-8">
          <Card className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <DollarSign className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Account Information
              </h3>
            </div>
            <div className="space-y-3">
              {isPortfoliosLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">BTC Holdings</span>
                    <span className="text-foreground font-semibold">
                      {(
                        (totalValue / (priceData?.price || 114682)) *
                        0.001
                      ).toFixed(5)}{' '}
                      BTC
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">USD Balance</span>
                    <span className="text-foreground font-semibold">
                      $
                      {(totalValue * 0.1).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Total Asset Value
                    </span>
                    <span className="text-primary font-bold">
                      $
                      {Math.max(
                        totalValue,
                        portfolioStats.totalValue
                      ).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Trading Statistics
              </h3>
            </div>
            <div className="space-y-3">
              {isTradesLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Trades</span>
                    <span className="text-foreground font-semibold">
                      {portfolioStats.totalTrades}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Return Rate</span>
                    <span
                      className={`font-semibold ${
                        portfolioStats.returnRate >= 0
                          ? 'text-green-500'
                          : 'text-red-500'
                      }`}
                    >
                      {portfolioStats.returnRate >= 0 ? '+' : ''}
                      {portfolioStats.returnRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Active Positions
                    </span>
                    <span className="text-foreground font-semibold">
                      {portfolioStats.activePositions}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="glass-card p-6 mb-8">
          <h3 className="text-xl font-semibold text-foreground mb-6">
            Recent Transaction History
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-6 gap-4 text-sm font-medium text-muted-foreground border-b border-border/30 pb-2">
              <span>Date</span>
              <span>Option Type</span>
              <span>Strike Price</span>
              <span>Premium</span>
              <span>Status</span>
              <span>Time to Expiry</span>
            </div>

            {isTradesLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin mr-3" />
                <span className="text-muted-foreground">
                  거래 내역을 불러오는 중...
                </span>
              </div>
            ) : tradeHistories.length > 0 ? (
              tradeHistories.slice(0, 5).map((trade, index) => {
                // 거래의 option_id로 정확한 옵션 찾기
                const relatedOption = activeOptionsData?.find(
                  option => option.id === trade.option_id
                );
                const expiryDate =
                  relatedOption?.expiry || '2025-09-26T16:00:00Z';

                return (
                  <div
                    key={trade.id || index}
                    className="grid grid-cols-6 gap-4 text-sm py-3 hover:bg-muted/20 rounded transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {new Date(trade.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`font-semibold ${
                        trade.trade_type === 'buy'
                          ? 'text-blue-500'
                          : 'text-orange-500'
                      }`}
                    >
                      {activeOptionsData?.find(
                        opt => opt.id === trade.option_id
                      )?.symbol || 'BTC'}
                    </span>
                    <span className="text-foreground">
                      $
                      {(
                        activeOptionsData?.find(
                          opt => opt.id === trade.option_id
                        )?.strike || 115000
                      ).toLocaleString()}
                    </span>
                    <span className="text-foreground">
                      ${trade.total_value.toLocaleString()}
                    </span>
                    <Badge
                      variant={
                        trade.trade_status === 'completed'
                          ? 'default'
                          : 'secondary'
                      }
                      className="w-fit text-xs"
                    >
                      {trade.trade_status || 'Active'}
                    </Badge>
                    <div className="text-xs">
                      <ExpiryCountdown expiryDate={expiryDate} compact={true} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>거래 내역이 없습니다.</p>
                <p className="text-sm mt-2">옵션 거래를 시작해보세요!</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PortfolioPage;
