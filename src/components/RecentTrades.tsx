
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface Trade {
  id: string;
  type: 'calls' | 'puts';
  action: 'Buy';
  strike: number;
  price: number;
  quantity: number;
  timestamp: Date;
}

interface RecentTradesProps {
  trades: Trade[];
}

export const RecentTrades = ({ trades }: RecentTradesProps) => {
  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card className="glass-card shadow-lg">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Recent Trades</h3>
        </div>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {trades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="w-16 h-16 bg-muted/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8" />
              </div>
              <p className="text-lg font-medium mb-1">No Recent Trades</p>
              <p className="text-sm">Your option purchases will appear here</p>
            </div>
          ) : (
            trades.map((trade) => (
              <div
                key={trade.id}
                className="flex items-center justify-between p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-all duration-200 border border-border/20"
              >
                <div className="flex items-center space-x-4">
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-3 py-1 font-semibold ${
                      trade.type === 'calls' 
                        ? 'border-green-500/30 text-green-400 bg-green-500/10' 
                        : 'border-red-500/30 text-red-400 bg-red-500/10'
                    }`}
                  >
                    {trade.action}
                  </Badge>
                  <div>
                    <div className="text-sm font-semibold">
                      {trade.type === 'calls' ? 'Call' : 'Put'} ${formatNumber(trade.strike, 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {trade.quantity} contract{trade.quantity !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-semibold">
                    ${formatNumber(trade.price)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(trade.timestamp)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
};
