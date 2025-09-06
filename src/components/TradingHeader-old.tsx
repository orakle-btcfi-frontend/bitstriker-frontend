import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface TradingHeaderProps {
  currentPrice: number;
}

export const TradingHeader = ({ currentPrice }: TradingHeaderProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(price);
  };

  return (
    <div className="border-b border-border/20 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-lg">
                  ₿
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Bitcoin Options
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time options trading
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-3xl font-bold price-green tracking-tight">
                  ${formatPrice(currentPrice)}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Current Price
                </div>
              </div>

              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-green-400">
                  +0.85%
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Badge
              variant="outline"
              className="border-primary/30 text-primary bg-primary/5 px-4 py-1.5"
            >
              Buy Only
            </Badge>
            <Badge variant="secondary" className="px-4 py-1.5">
              Daily Expiry
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
