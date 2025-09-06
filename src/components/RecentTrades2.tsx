import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { useContracts } from '@/hooks/api/useNewBTCOptions';
import { NewContract } from '@/types/api';

interface RecentTrades2Props {
  maxItems?: number;
}

export const RecentTrades2 = ({ maxItems = 10 }: RecentTrades2Props) => {
  // 새로운 API에서 계약 목록 가져오기
  const { data: contracts, isLoading, error } = useContracts();

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const formatBTCAmount = (amount: string) => {
    return `₿${parseFloat(amount).toFixed(8)}`;
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  // 최근 계약들을 거래 형태로 변환
  const recentTrades = contracts
    ? contracts.slice(0, maxItems).map((contract, index) => ({
        id: `contract-${index}`,
        type: contract.side.toLowerCase() as 'call' | 'put',
        action: 'Buy' as const,
        strike: contract.strike_price,
        price: parseFloat(contract.premium),
        quantity: parseFloat(contract.quantity),
        timestamp: contract.expires,
        contract: contract,
      }))
    : [];

  if (isLoading) {
    return (
      <Card className="glass-card shadow-lg">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold">Recent Trades</h3>
          </div>
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-sm">Loading trade data...</div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-card shadow-lg">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold">Recent Trades</h3>
          </div>
          <div className="text-center py-8 text-red-500">
            <div className="text-sm">
              An error occurred while loading trade data.
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {error.message}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card shadow-lg">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold">Recent Trades</h3>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {recentTrades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <div className="text-lg font-medium mb-2">No Recent Trades</div>
              <div className="text-sm">No trades yet.</div>
            </div>
          ) : (
            recentTrades.map(trade => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-all duration-200 border border-transparent hover:border-border/30"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      trade.type === 'call'
                        ? 'bg-[hsl(var(--trading-green))]/10'
                        : 'bg-[hsl(var(--trading-red))]/10'
                    }`}
                  >
                    {trade.type === 'call' ? (
                      <TrendingUp
                        className={`w-5 h-5 text-[hsl(var(--trading-green))]`}
                      />
                    ) : (
                      <TrendingDown
                        className={`w-5 h-5 text-[hsl(var(--trading-red))]`}
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-semibold text-sm">
                        {trade.action} {trade.type === 'call' ? 'Call' : 'Put'}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          trade.type === 'call'
                            ? 'bg-[hsl(var(--trading-green))]/10 text-[hsl(var(--trading-green))] border-[hsl(var(--trading-green))]/30'
                            : 'bg-[hsl(var(--trading-red))]/10 text-[hsl(var(--trading-red))] border-[hsl(var(--trading-red))]/30'
                        }`}
                      >
                        ${formatNumber(trade.strike, 0)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Qty: {formatNumber(trade.quantity, 4)} BTC • Expires:{' '}
                      {formatDate(trade.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm text-[hsl(var(--trading-yellow))]">
                    {formatBTCAmount(trade.contract.premium)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(trade.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {recentTrades.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/20">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">
                Total {contracts?.length || 0} contracts created
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
