import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useCreateContract } from '@/hooks/api/useNewBTCOptions';
import { useToast } from '@/hooks/use-toast';
import { NewContractRequest } from '@/types/api';
import { useWallet } from '@/contexts/WalletContext';

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  option: any;
  currentPrice: number;
  symbol: string;
  selectedExpiry?: string; // "1d", "2d", "3d", "5d", "7d" 형식
}

export const TradingModal = ({
  isOpen,
  onClose,
  option,
  currentPrice,
  symbol,
  selectedExpiry,
}: TradingModalProps) => {
  const [quantity, setQuantity] = useState('0.1'); // BTC 단위로 시작
  const { toast } = useToast();
  const { state } = useWallet(); // 지갑 상태 가져오기

  // 새로운 API의 계약 생성 훅 사용
  const createContract = useCreateContract();

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !option) return null;

  const isCall = option.type === 'calls';
  const premiumBTC = option?.mark || 0; // 이미 BTC 단위
  const quantityNum = parseFloat(quantity) || 0;
  const totalCostBTC = quantityNum * premiumBTC;
  const totalCostUSD = totalCostBTC * currentPrice;

  // 사용자 지갑 잔고 (BTC 단위)
  const userBalance = state.wallet?.balance || 0;

  // 옵션의 최대 거래 가능량 계산
  const calculateMaxQuantity = () => {
    if (premiumBTC <= 0) return 0;

    // 1. 지갑 잔고 기반 최대량 (프리미엄으로 나눈 값)
    const balanceBasedMax = userBalance / premiumBTC;

    // 2. 리스크 관리 기반 최대량 (예: 지갑의 50%까지만 허용)
    const riskBasedMax = (userBalance * 0.5) / premiumBTC;

    // 3. API에서 제공하는 max_quantity (있다면)
    const apiMaxQuantity = parseFloat(option?.max_quantity || '999999');

    // 가장 제한적인 값 사용
    return Math.min(balanceBasedMax, riskBasedMax, apiMaxQuantity);
  };

  const maxQuantity = calculateMaxQuantity();

  // 실제 거래 가능한 최대량 (잔고와 max_quantity 중 작은 값)
  const actualMaxQuantity = Math.min(userBalance / premiumBTC, maxQuantity);

  // 잔고 부족 여부 체크 (유효한 값일 때만)
  const isInsufficientBalance =
    quantity !== '' && // 빈 문자열이 아니고
    quantityNum > 0 && // 0보다 크고
    premiumBTC > 0 && // 프리미엄이 유효하고
    (quantityNum > maxQuantity || totalCostBTC > userBalance); // quantity가 max를 초과하거나 총 비용이 잔고 초과

  const handleTrade = async () => {
    try {
      // 선택된 만료일을 Unix timestamp로 변환
      const calculateExpiryTimestamp = (expiry: string): number => {
        const days = parseInt(expiry.replace('d', ''));
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + days);
        // 만료일의 특정 시간으로 설정 (예: 오후 4시)
        expiryDate.setHours(16, 0, 0, 0);
        return Math.floor(expiryDate.getTime() / 1000);
      };

      const expiresTimestamp = selectedExpiry
        ? calculateExpiryTimestamp(selectedExpiry)
        : Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 폴백: 7일 후

      const contractData: NewContractRequest = {
        side: isCall ? 'Call' : 'Put',
        strike_price: option.strike,
        quantity: quantityNum,
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
      onClick={onClose}
    >
      <div
        className={`h-full w-96 bg-card/95 backdrop-blur-lg border-l border-border/30 shadow-2xl transform transition-transform duration-500 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        onClick={e => e.stopPropagation()}
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
                type="text"
                value={quantity}
                onChange={e => {
                  const value = e.target.value;
                  // 숫자와 소수점만 허용
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setQuantity(value);
                  }
                }}
                className="bg-background"
                placeholder="0.1"
                onBlur={e => {
                  // 포커스를 잃을 때 유효성 검사
                  const value = parseFloat(e.target.value);
                  if (isNaN(value) || value <= 0) {
                    setQuantity(''); // 빈 값으로 두어서 사용자가 직접 입력하도록
                  } else if (
                    totalCostBTC > userBalance ||
                    quantityNum > maxQuantity
                  ) {
                    // 총 비용이 잔고를 초과하거나 max_quantity를 초과하면 실제 최대 가능한 양으로 조정
                    if (actualMaxQuantity > 0) {
                      setQuantity(actualMaxQuantity.toFixed(8));
                    } else {
                      setQuantity('0');
                    }
                  }
                }}
              />
              <div className="text-xs space-y-1 mt-3">
                <div className="text-muted-foreground">
                  <span className="font-semibold text-primary">
                    Max Tradable: {maxQuantity.toFixed(8).replace(/\.?0+$/, '')}{' '}
                    BTC
                  </span>
                  <span className="text-muted-foreground ml-2">
                    (Risk Limit)
                  </span>
                </div>
                <div className="text-muted-foreground">
                  Balance: {userBalance.toFixed(8).replace(/\.?0+$/, '')} BTC
                </div>
                {isInsufficientBalance && (
                  <div className="text-red-500 mt-2">
                    ⚠️{' '}
                    {quantityNum > maxQuantity
                      ? 'Exceeds risk limit'
                      : 'Insufficient balance'}
                  </div>
                )}
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
            disabled={
              createContract.isPending ||
              quantityNum <= 0 ||
              isInsufficientBalance ||
              !state.isConnected
            }
          >
            {createContract.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Contract...
              </>
            ) : !state.isConnected ? (
              'Connect Wallet First'
            ) : isInsufficientBalance ? (
              quantityNum > maxQuantity ? (
                'Exceeds Risk Limit'
              ) : (
                'Insufficient Balance'
              )
            ) : (
              `Buy ${isCall ? 'Call' : 'Put'}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
