import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, Target, BarChart3 } from 'lucide-react';
import {
  useTopBanner,
  usePortfolioDelta,
  useNewApiHealth,
} from '@/hooks/api/useNewBTCOptions';

interface TradingHeader2Props {
  currentPrice: number;
}

export const TradingHeader2 = ({ currentPrice }: TradingHeader2Props) => {
  const { data: topBannerData } = useTopBanner();
  const { data: portfolioDelta } = usePortfolioDelta();
  const { data: healthData } = useNewApiHealth();

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
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">₿</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Bitcoin Options
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time options trading based on Black-Scholes model
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

          {/* API Stats */}
          <div className="flex items-center space-x-6">
            {/* API Status */}
            <div className="text-center">
              <div className="flex items-center space-x-2 mb-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    healthData?.status === 'healthy'
                      ? 'bg-green-500'
                      : 'bg-yellow-500'
                  }`}
                />
                <span className="text-sm font-medium">
                  {healthData?.status || 'Loading...'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                API Status
              </div>
            </div>

            {/* 24h Volume */}
            {topBannerData && (
              <div className="text-center">
                <div className="flex items-center space-x-2 mb-1">
                  <BarChart3 className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-600">
                    ₿{topBannerData.volume_24hr.toFixed(4)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  24H Volume
                </div>
              </div>
            )}

            {/* Open Interest */}
            {topBannerData && (
              <div className="text-center">
                <div className="flex items-center space-x-2 mb-1">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600">
                    ${topBannerData.open_interest_usd.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Open Interest
                </div>
              </div>
            )}

            {/* Portfolio Delta */}
            {portfolioDelta !== undefined && (
              <div className="text-center">
                <div className="flex items-center space-x-2 mb-1">
                  <Target className="w-4 h-4 text-orange-500" />
                  <span
                    className={`text-sm font-medium ${
                      portfolioDelta >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {portfolioDelta >= 0 ? '+' : ''}
                    {portfolioDelta.toFixed(6)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Portfolio Δ
                </div>
              </div>
            )}

            {/* Contract Count */}
            {topBannerData && (
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">
                  {topBannerData.contract_count}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">
                  Contracts
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
