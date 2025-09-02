import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, TrendingDown } from 'lucide-react';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  option: any;
  currentPrice: number;
  symbol: string;
}

export const TradingModal = ({ isOpen, onClose, option, currentPrice, symbol }: TradingModalProps) => {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !option) return null;

  const isCall = option.type === 'calls';
  const totalCostUSD = quantity * (option?.mark || 0);
  const totalCostBTC = totalCostUSD / currentPrice;

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end transition-opacity duration-300 ${
      isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
    }`}>
      <div 
        className={`h-full w-96 bg-card/95 backdrop-blur-lg border-l border-border/30 shadow-2xl transform transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              {isCall ? (
                <TrendingUp className="w-5 h-5 text-[hsl(var(--trading-green))]" />
              ) : (
                <TrendingDown className="w-5 h-5 text-[hsl(var(--trading-red))]" />
              )}
              <span className="text-lg font-semibold">
                {symbol}-{option.strike}-{isCall ? 'C' : 'P'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-muted/50"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Option Details */}
          <Card className="p-4 mb-6 bg-muted/20">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Strike Price</span>
                <span className="font-semibold">${option.strike.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Current Price</span>
                <span className="font-semibold">${currentPrice.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Delta</span>
                <span className="font-semibold">{option.delta.toFixed(3)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">IV</span>
                <span className="font-semibold text-[hsl(var(--trading-yellow))]">{option.iv.toFixed(1)}%</span>
              </div>
            </div>
          </Card>

          {/* Premium Display */}
          <Card className="p-4 mb-6 bg-primary/10 border-primary/30">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Premium (You Pay)</div>
              <div className="text-2xl font-bold text-primary mb-2">
                ${option.mark.toFixed(2)} USD
              </div>
              <div className="text-lg font-semibold text-[hsl(var(--trading-yellow))]">
                ₿ {(option.mark / currentPrice).toFixed(6)} BTC
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Actual payment amount in BTC
              </div>
            </div>
          </Card>

          {/* Trading Form */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Quantity</label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="bg-background"
                min="1"
              />
              <div className="text-xs text-muted-foreground mt-1">
                1 Contract = 1 BTC Option
              </div>
            </div>

            <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Premium per contract</span>
                <span className="font-semibold">${option?.mark.toFixed(2) || '0.00'} USD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total amount (USD)</span>
                <span className="font-semibold">${(quantity * (option?.mark || 0)).toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t border-border/20 pt-2">
                <span className="text-[hsl(var(--trading-yellow))]">You pay (BTC)</span>
                <span className="text-[hsl(var(--trading-yellow))]">
                  ₿ {((quantity * (option?.mark || 0)) / currentPrice).toFixed(6)} BTC
                </span>
              </div>
            </div>
          </div>

          {/* Buy Button */}
          <Button 
            className={`w-full py-3 font-semibold ${
              isCall 
                ? 'bg-[hsl(var(--trading-green))] hover:bg-[hsl(var(--trading-green))]/90 text-white'
                : 'bg-[hsl(var(--trading-red))] hover:bg-[hsl(var(--trading-red))]/90 text-white'
            }`}
          >
            Buy {isCall ? 'Call' : 'Put'}
          </Button>
        </div>
      </div>
    </div>
  );
};