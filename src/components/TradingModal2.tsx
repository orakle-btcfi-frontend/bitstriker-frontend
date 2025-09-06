import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useCreateContract } from '@/hooks/api/useNewBTCOptions';
import { useToast } from '@/hooks/use-toast';
import { NewContractRequest } from '@/types/api';

interface TradingModal2Props {
  isOpen: boolean;
  onClose: () => void;
  option: any;
  currentPrice: number;
  symbol: string;
}

export const TradingModal2 = ({
  isOpen,
  onClose,
  option,
  currentPrice,
  symbol,
}: TradingModal2Props) => {
  const [quantity, setQuantity] = useState(0.1); // BTC 단위로 시작
  const { toast } = useToast();

  // 새로운 API의 계약 생성 훅 사용
  const createContract = useCreateContract();

  if (!isOpen || !option) return null;

  const isCall = option.type === 'calls';
  const premiumBTC = option?.mark || 0; // 이미 BTC 단위
  const totalCostBTC = quantity * premiumBTC;
  const totalCostUSD = totalCostBTC * currentPrice;

  const handleTrade = async () => {
    try {
      // 만료일을 Unix timestamp로 변환 (임시로 7일 후로 설정)
      const expiresTimestamp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;

      const contractData: NewContractRequest = {
        side: isCall ? 'Call' : 'Put',
        strike_price: option.strike,
        quantity: quantity,
        expires: expiresTimestamp,
        premium: premiumBTC,
      };

      await createContract.mutateAsync(contractData);

      toast({
        title: 'Trade Successful!',
        description: `${isCall ? 'Call' : 'Put'} option contract has been created.`,
        variant: 'default',
      });

      onClose();
    } catch (error: any) {
      toast({
        title: 'Trade Failed',
        description:
          error.message || 'An error occurred while creating the contract.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-end transition-opacity duration-300 ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
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
                <span className="text-sm text-muted-foreground">
                  Strike Price
                </span>
                <span className="font-semibold">
                  ${option.strike.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Current Price
                </span>
                <span className="font-semibold">
                  ${currentPrice.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Delta</span>
                <span className="font-semibold">
                  {option.delta?.toFixed(3) || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">IV</span>
                <span className="font-semibold text-[hsl(var(--trading-yellow))]">
                  {((option.iv || 0) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </Card>

          {/* Premium Display - BTC 단위로 표시 */}
          <Card className="p-4 mb-6 bg-primary/10 border-primary/30">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">
                Premium (You Pay per BTC)
              </div>
              <div className="text-2xl font-bold text-[hsl(var(--trading-yellow))] mb-2">
                ₿ {premiumBTC.toFixed(8)} BTC
              </div>
              <div className="text-lg font-semibold text-primary">
                ≈ ${(premiumBTC * currentPrice).toFixed(2)} USD
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                BTC as base unit
              </div>
            </div>
          </Card>

          {/* Trading Form */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Quantity (BTC)
              </label>
              <Input
                type="number"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
                className="bg-background"
                min="0.01"
                step="0.01"
                placeholder="0.1"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Minimum: 0.01 BTC
              </div>
            </div>

            <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Premium per BTC</span>
                <span className="font-semibold">
                  ₿ {premiumBTC.toFixed(8)} BTC
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Total premium (BTC)
                </span>
                <span className="font-semibold">
                  ₿ {totalCostBTC.toFixed(8)} BTC
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Total amount (USD)
                </span>
                <span className="font-semibold">
                  ${totalCostUSD.toFixed(2)} USD
                </span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t border-border/20 pt-2">
                <span className="text-[hsl(var(--trading-yellow))]">
                  You pay (BTC)
                </span>
                <span className="text-[hsl(var(--trading-yellow))]">
                  ₿ {totalCostBTC.toFixed(8)} BTC
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
            onClick={handleTrade}
            disabled={createContract.isPending || quantity <= 0}
          >
            {createContract.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Contract...
              </>
            ) : (
              `Buy ${isCall ? 'Call' : 'Put'}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
