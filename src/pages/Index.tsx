import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  DollarSign,
  Activity,
} from 'lucide-react';
import { OptionsTable } from '@/components/OptionsTable';
import { TradingHeader } from '@/components/TradingHeader';
import { RecentTrades } from '@/components/RecentTrades';

interface Trade {
  id: string;
  type: 'calls' | 'puts';
  action: 'Buy';
  strike: number;
  price: number;
  quantity: number;
  timestamp: Date;
}

const Index = () => {
  const [currentPrice, setCurrentPrice] = useState(117934.2);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);

  // Simulate real-time price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrice(prev => {
        const change = (Math.random() - 0.5) * 100;
        return Math.max(prev + change, 100000);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleTrade = (trade: {
    type: 'calls' | 'puts';
    strike: number;
    price: number;
    quantity: number;
  }) => {
    const newTrade: Trade = {
      id: Date.now().toString(),
      ...trade,
      action: 'Buy',
      timestamp: new Date(),
    };

    setRecentTrades(prev => [newTrade, ...prev.slice(0, 19)]); // Keep last 20 trades
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <TradingHeader currentPrice={currentPrice} />

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Main Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          {/* Options Tables */}
          <div className="lg:col-span-3">
            <Card className="glass-card shadow-xl overflow-hidden">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-8">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-[hsl(var(--trading-green))]" />
                      <h3 className="text-lg font-semibold text-[hsl(var(--trading-green))]">
                        Calls
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingDown className="w-5 h-5 text-[hsl(var(--trading-red))]" />
                      <h3 className="text-lg font-semibold text-[hsl(var(--trading-red))]">
                        Puts
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Expires: 00:37:19</span>
                    </div>
                    <Badge variant="outline" className="px-3 py-1">
                      Settlement: {currentPrice.toFixed(1)}
                    </Badge>
                  </div>
                </div>

                <OptionsTable
                  currentPrice={currentPrice}
                  onTrade={handleTrade}
                />
              </div>
            </Card>
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="glass-card shadow-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Activity className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Market Info</h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">ATM Vol</span>
                  <span className="text-sm font-semibold price-yellow">
                    20.0%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">
                    24H Call Volume
                  </span>
                  <span className="text-sm font-semibold">865.98</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">
                    24H Put Volume
                  </span>
                  <span className="text-sm font-semibold">2,642.76</span>
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-muted-foreground">
                    Est. Settlement
                  </span>
                  <span className="text-sm font-bold">
                    ${currentPrice.toFixed(1)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Trading Notice */}
            <Card className="glass-card shadow-lg p-6 border-primary/20">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-primary mb-2">
                    One-Way Trading
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Purchase call and put options with ease. All positions are
                    held until expiry or exercise.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Recent Trades */}
        <RecentTrades trades={recentTrades} />
      </div>
    </div>
  );
};

export default Index;
