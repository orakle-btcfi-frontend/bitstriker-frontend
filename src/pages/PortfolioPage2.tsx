import { Navigation } from '@/components/Navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Loader2,
  Target,
  Activity,
  BarChart3,
} from 'lucide-react';
import {
  useContracts,
  usePortfolioDelta,
  useTopBanner,
  useNewApiHealth,
} from '@/hooks/api/useNewBTCOptions';
import { useBTCPriceChange } from '@/hooks/api/useBTCPrice';
import { ExpiryCountdown } from '@/components/ExpiryCountdown';
import { RecentTrades2 } from '@/components/RecentTrades2';
import { useMemo } from 'react';
import { NewContract } from '@/types/api';

interface PortfolioStats {
  totalValue: number;
  activePositions: number;
  todayPnL: number;
  totalPnL: number;
  totalTrades: number;
  returnRate: number;
}

interface TreeMapItem {
  name: string;
  value: number;
  category: string;
  color: string;
  children?: TreeMapItem[];
}

const PortfolioPage2 = () => {
  // 실시간 데이터 가져오기
  const { data: priceData } = useBTCPriceChange();

  // 새로운 API 데이터들
  const { data: contracts, isLoading: isContractsLoading } = useContracts();
  const { data: portfolioDelta } = usePortfolioDelta();
  const { data: topBannerData } = useTopBanner();
  const { data: healthData } = useNewApiHealth();

  const currentPrice = priceData?.price || 114682;

  // 새로운 API 기반 포트폴리오 통계 계산
  const portfolioStats: PortfolioStats = useMemo(() => {
    if (!contracts || contracts.length === 0) {
      return {
        totalValue: 0,
        activePositions: 0,
        todayPnL: 0,
        totalPnL: 0,
        totalTrades: 0,
        returnRate: 0,
      };
    }

    const totalPremium = contracts.reduce((sum, contract) => {
      return sum + parseFloat(contract.premium);
    }, 0);

    const totalValueUSD = totalPremium * currentPrice;
    const activePositions = contracts.length;

    // 임시 PnL 계산 (실제로는 현재 옵션 가격과 비교해야 함)
    const estimatedPnL = totalValueUSD * 0.05; // 5% 가정

    return {
      totalValue: totalValueUSD,
      activePositions,
      todayPnL: estimatedPnL * 0.3, // 오늘 PnL은 전체의 30%로 가정
      totalPnL: estimatedPnL,
      totalTrades: activePositions,
      returnRate: (estimatedPnL / totalValueUSD) * 100,
    };
  }, [contracts, currentPrice]);

  // 새로운 API 기반 포트폴리오 데이터 생성
  const portfolioData: TreeMapItem[] = useMemo(() => {
    if (!contracts || contracts.length === 0) {
      return [];
    }

    const callContracts = contracts.filter(c => c.side === 'Call');
    const putContracts = contracts.filter(c => c.side === 'Put');

    const callValue = callContracts.reduce((sum, contract) => {
      return sum + parseFloat(contract.premium) * currentPrice;
    }, 0);

    const putValue = putContracts.reduce((sum, contract) => {
      return sum + parseFloat(contract.premium) * currentPrice;
    }, 0);

    const result: TreeMapItem[] = [];

    if (callValue > 0) {
      result.push({
        name: 'BTC Calls',
        value: callValue,
        category: 'calls',
        color: 'bg-green-500',
        children: callContracts.map((contract, index) => ({
          name: `Call $${contract.strike_price.toLocaleString()}`,
          value: parseFloat(contract.premium) * currentPrice,
          category: 'calls',
          color: 'bg-green-400',
        })),
      });
    }

    if (putValue > 0) {
      result.push({
        name: 'BTC Puts',
        value: putValue,
        category: 'puts',
        color: 'bg-red-500',
        children: putContracts.map((contract, index) => ({
          name: `Put $${contract.strike_price.toLocaleString()}`,
          value: parseFloat(contract.premium) * currentPrice,
          category: 'puts',
          color: 'bg-red-400',
        })),
      });
    }

    return result;
  }, [contracts, currentPrice]);

  // 만료일별 포지션 그룹화
  const positionsByExpiry = useMemo(() => {
    if (!contracts) return [];

    const grouped = contracts.reduce(
      (acc, contract) => {
        const expiryDate = new Date(contract.expires * 1000);
        const key = expiryDate.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!acc[key]) {
          acc[key] = {
            expiry: contract.expires,
            contracts: [],
            totalValue: 0,
          };
        }

        acc[key].contracts.push(contract);
        acc[key].totalValue += parseFloat(contract.premium) * currentPrice;

        return acc;
      },
      {} as Record<
        string,
        { expiry: number; contracts: NewContract[]; totalValue: number }
      >
    );

    return Object.values(grouped).sort((a, b) => a.expiry - b.expiry);
  }, [contracts, currentPrice]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Portfolio Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Portfolio Overview</h1>
          <p className="text-xl text-muted-foreground">
            Bitcoin options portfolio management
          </p>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700"
                >
                  Total
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-primary">
                  ${portfolioStats.totalValue.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  Portfolio Value
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                  <Activity className="w-6 h-6 text-blue-500" />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700"
                >
                  Active
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">
                  {portfolioStats.activePositions}
                </div>
                <div className="text-sm text-muted-foreground">
                  Active Positions
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass-card shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <Badge
                  variant="outline"
                  className="text-xs bg-green-50 text-green-700"
                >
                  P&L
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">
                  ${portfolioStats.totalPnL.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Total P&L</div>
              </div>
            </div>
          </Card>

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
                  Delta
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-purple-600">
                  {portfolioDelta?.toFixed(4) || '0.0000'}
                </div>
                <div className="text-sm text-muted-foreground">
                  Portfolio Delta
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Portfolio Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Portfolio Composition */}
          <Card className="glass-card shadow-lg">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Portfolio Composition</h3>
              </div>

              {portfolioData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8" />
                  </div>
                  <div className="text-lg font-medium mb-2">
                    No Active Positions
                  </div>
                  <div className="text-sm">No positions yet.</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {portfolioData.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-4 h-4 rounded ${item.color} opacity-80`}
                          />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <span className="font-semibold">
                          ${item.value.toLocaleString()}
                        </span>
                      </div>
                      {item.children && (
                        <div className="ml-7 space-y-1">
                          {item.children.map((child, childIndex) => (
                            <div
                              key={childIndex}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-2 h-2 rounded ${child.color} opacity-60`}
                                />
                                <span className="text-muted-foreground">
                                  {child.name}
                                </span>
                              </div>
                              <span className="text-muted-foreground">
                                ${child.value.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Recent Trades */}
          <RecentTrades2 maxItems={8} />
        </div>

        {/* Positions by Expiry */}
        {positionsByExpiry.length > 0 && (
          <Card className="glass-card shadow-lg mb-12">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-semibold">Positions by Expiry</h3>
              </div>

              <div className="space-y-4">
                {positionsByExpiry.map((group, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg bg-muted/20 border border-border/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <ExpiryCountdown
                          expiryDate={new Date(
                            group.expiry * 1000
                          ).toISOString()}
                          compact={true}
                        />
                        <span className="font-medium">
                          {group.contracts.length} contracts
                        </span>
                      </div>
                      <span className="font-semibold text-primary">
                        ${group.totalValue.toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.contracts.map((contract, contractIndex) => (
                        <div
                          key={contractIndex}
                          className="p-3 rounded bg-background/50 border border-border/20"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                contract.side === 'Call'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {contract.side}
                            </Badge>
                            <span className="text-sm font-medium">
                              ${contract.strike_price.toLocaleString()}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Qty: {parseFloat(contract.quantity).toFixed(4)} BTC
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Premium: ₿{parseFloat(contract.premium).toFixed(8)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {isContractsLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <div className="text-lg font-medium mb-2">
              Loading portfolio data...
            </div>
            <div className="text-sm text-muted-foreground">
              Fetching contract information.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioPage2;
