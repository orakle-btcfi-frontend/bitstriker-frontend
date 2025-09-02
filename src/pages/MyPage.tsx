import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Navigation } from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  Copy,
  Check,
  Wallet,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useUserInfo,
  useUserTradeHistories,
  useUserPortfolios,
  calculatePortfolioStats,
} from '@/hooks/api/useUserData';
import { useBTCPriceChange } from '@/hooks/api/useBTCPrice';
import { useMemo } from 'react';

const MyPage = () => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // 실시간 데이터 가져오기
  const { data: priceData } = useBTCPriceChange();

  // 사용자 데이터 (임시로 userId 1 사용)
  const userId = 1;
  const { data: userInfo, isLoading: isUserLoading } = useUserInfo(userId);

  const { data: tradeHistories = [], isLoading: isTradesLoading } =
    useUserTradeHistories({ userId, limit: 20 });

  const { data: portfolios = [], isLoading: isPortfoliosLoading } =
    useUserPortfolios({ userId });

  // 포트폴리오 통계 계산
  const portfolioStats = useMemo(() => {
    if (!tradeHistories || !portfolios) {
      return {
        totalValue: 595.88,
        activePositions: 3,
        todayPnL: 0,
        totalPnL: 0,
        totalTrades: 0,
        returnRate: 0,
      };
    }
    return calculatePortfolioStats(portfolios, tradeHistories);
  }, [portfolios, tradeHistories]);

  // 지갑 주소 (실제로는 사용자 정보에서 가져와야 함)
  const walletAddress =
    userInfo?.wallet_address || 'tb1qch7l3vuuzdldhjx908f40cpjxu0pzkhtd3j3m5';

  // BTC 보유량 계산
  const btcHoldings = useMemo(() => {
    const currentPrice = priceData?.price || 114682;
    return (portfolioStats.totalValue / currentPrice).toFixed(5);
  }, [portfolioStats.totalValue, priceData?.price]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast({
        title: 'Address Copied',
        description: 'Wallet address has been copied to clipboard.',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy address.',
        variant: 'destructive',
      });
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-6 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Page</h1>
          <p className="text-muted-foreground">
            View your account information and trading history
          </p>
        </div>

        {/* User Profile & Wallet Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Profile - 실시간 데이터 */}
          <Card className="glass-card p-6">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                {isUserLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <h2 className="text-xl font-semibold text-foreground">
                      {userInfo?.name ||
                        `User-${userId.toString().padStart(5, '0')}`}
                    </h2>
                    <Badge variant="outline" className="mt-1">
                      {userInfo?.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-2 text-sm">
              {isUserLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Join Date</span>
                    <span className="text-foreground">
                      {userInfo?.created_at
                        ? new Date(userInfo.created_at).toLocaleDateString()
                        : '2024-01-15'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Login</span>
                    <span className="text-foreground">
                      {userInfo?.last_login_at
                        ? new Date(userInfo.last_login_at).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Trades</span>
                    <span className="text-foreground font-semibold">
                      {portfolioStats.totalTrades}
                    </span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Wallet Address */}
          <Card className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Wallet className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Wallet Address
              </h3>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-3">
                    <p className="text-xs text-muted-foreground mb-1">
                      BTC 주소
                    </p>
                    <p className="text-sm font-mono text-foreground break-all">
                      {walletAddress}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    className="flex items-center space-x-2 shrink-0"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="text-xs">
                      {copied ? 'Copied' : 'Copy'}
                    </span>
                  </Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                <p>• You can deposit BTC to this address</p>
                <p>• Please verify the address before use</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <Card className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <DollarSign className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Portfolio Value
              </h3>
            </div>
            {isPortfoliosLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">BTC Holdings</span>
                  <span className="text-foreground font-semibold">
                    {btcHoldings} BTC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">USD Value</span>
                  <span className="text-foreground font-semibold">
                    ${portfolioStats.totalValue.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Active Positions
                  </span>
                  <span className="text-primary font-bold">
                    {portfolioStats.activePositions}
                  </span>
                </div>
              </div>
            )}
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                P&L Summary
              </h3>
            </div>
            {isTradesLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Today's P&L</span>
                  <span
                    className={`font-semibold ${
                      portfolioStats.todayPnL >= 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                  >
                    {portfolioStats.todayPnL >= 0 ? '+' : ''}$
                    {portfolioStats.todayPnL.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total P&L</span>
                  <span
                    className={`font-semibold ${
                      portfolioStats.totalPnL >= 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                  >
                    {portfolioStats.totalPnL >= 0 ? '+' : ''}$
                    {portfolioStats.totalPnL.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Return Rate</span>
                  <span
                    className={`font-bold ${
                      portfolioStats.returnRate >= 0
                        ? 'text-green-500'
                        : 'text-red-500'
                    }`}
                  >
                    {portfolioStats.returnRate >= 0 ? '+' : ''}
                    {portfolioStats.returnRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Calendar className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">
                Trading Activity
              </h3>
            </div>
            {isTradesLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Trades</span>
                  <span className="text-foreground font-semibold">
                    {portfolioStats.totalTrades}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">This Week</span>
                  <span className="text-foreground font-semibold">
                    {
                      tradeHistories.filter((trade) => {
                        const tradeDate = new Date(trade.created_at);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return tradeDate > weekAgo;
                      }).length
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Trade</span>
                  <span className="text-foreground font-semibold">
                    {tradeHistories.length > 0
                      ? new Date(
                          tradeHistories[0].created_at
                        ).toLocaleDateString()
                      : 'Never'}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Trades */}
        {tradeHistories.length > 0 && (
          <Card className="glass-card p-6 mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-6">
              Recent Trades
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-5 gap-4 text-sm font-medium text-muted-foreground border-b border-border/30 pb-2">
                <span>Date</span>
                <span>Type</span>
                <span>Strike</span>
                <span>Amount</span>
                <span>Status</span>
              </div>

              {isTradesLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" />
                  <span className="text-muted-foreground">
                    거래 내역을 불러오는 중...
                  </span>
                </div>
              ) : (
                tradeHistories.slice(0, 5).map((trade, index) => (
                  <div
                    key={trade.id || index}
                    className="grid grid-cols-5 gap-4 text-sm py-3 hover:bg-muted/20 rounded transition-colors"
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
                      {trade.trade_type?.toUpperCase()} OPTION
                    </span>
                    <span className="text-foreground">
                      ${trade.price.toLocaleString()}
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
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyPage;
