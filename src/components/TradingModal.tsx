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
  const [quantity, setQuantity] = useState('0.001'); // BTC 단위로 시작 (더 안전한 기본값)
  const { toast } = useToast();
  const { state } = useWallet(); // 지갑 상태 가져오기

  // 새로운 API의 계약 생성 훅 사용
  const createContract = useCreateContract();

  // 모달이 열릴 때 적절한 기본 수량 설정
  useEffect(() => {
    if (isOpen && option) {
      const maxQty = option?.max_quantity || 0.001;
      // max_quantity의 10% 정도를 기본값으로 설정 (최소 0.0001, 최대 0.01)
      const suggestedQty = Math.min(Math.max(maxQty * 0.1, 0.0001), 0.01);
      setQuantity(suggestedQty.toFixed(6));
    }
  }, [isOpen, option]);

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
  // 옵션 타입에 따라 올바른 premium 값 가져오기
  // OptionsTable에서 { ...option.call, strike } 또는 { ...option.put, strike } 형태로 전달됨
  const premiumBTC = option?.mark || 0;
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

    // 3. API에서 제공하는 max_quantity (옵션 타입에 따라 다름)
    const apiMaxQuantity = option?.max_quantity || 999999;

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
      // Premium 값 검증
      if (premiumBTC <= 0) {
        toast({
          title: 'Trade Failed',
          description:
            '옵션 프리미엄 값이 올바르지 않습니다. 다른 옵션을 선택해주세요.',
          variant: 'destructive',
        });
        return;
      }
      // 선택된 만료일을 Unix timestamp로 변환
      const calculateExpiryTimestamp = (expiry: string): number => {
        const days = parseInt(expiry.replace('d', ''));
        const now = new Date();

        // 현재 시간 + 지정된 일수 (밀리초 단위)
        const expiryTime = now.getTime() + days * 24 * 60 * 60 * 1000;

        return Math.floor(expiryTime / 1000);
      };

      const expiresTimestamp = selectedExpiry
        ? calculateExpiryTimestamp(selectedExpiry)
        : Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60; // 폴백: 7일 후

      const contractData: NewContractRequest = {
        side: isCall ? 'Call' : 'Put',
        strike_price: option.strike, // OptionData의 strike 필드 사용
        quantity: quantityNum,
        expires: expiresTimestamp,
        premium: premiumBTC,
      };

      // 디버깅을 위한 로그
      console.log('Contract data being sent:', contractData);
      console.log('Option data:', option);
      console.log('isCall:', isCall);
      console.log('premiumBTC:', premiumBTC);
      console.log('option.mark:', option?.mark);
      console.log('option.max_quantity:', option?.max_quantity);
      console.log('option.strike:', option?.strike);
      console.log('maxQuantity calculated:', maxQuantity);
      console.log('quantityNum:', quantityNum);
      console.log('Selected expiry:', selectedExpiry);
      console.log('Calculated expires timestamp:', expiresTimestamp);
      console.log('Current time:', Math.floor(Date.now() / 1000));

      await createContract.mutateAsync(contractData);

      toast({
        title: 'Trade Successful!',
        description: `${isCall ? 'Call' : 'Put'} option contract has been created.`,
        variant: 'default',
      });

      onClose();
    } catch (error: any) {
      console.error('Contract creation error:', error);

      let errorMessage = 'An error occurred while creating the contract.';

      // API 에러 메시지 파싱
      if (error.message) {
        if (error.message.includes('expiration date must be in the future')) {
          errorMessage = '만료일이 과거로 설정되었습니다. 다시 시도해주세요.';
        } else if (error.message.includes('Validation error')) {
          errorMessage = `입력값 오류: ${error.message.replace('Validation error: ', '')}`;
        } else if (error.message.includes('exceeds maximum allowed quantity')) {
          errorMessage =
            '요청한 수량이 최대 허용 수량을 초과했습니다. 수량을 줄여주세요.';
        } else if (error.message.includes('Available collateral')) {
          errorMessage =
            '담보가 부족합니다. 수량을 줄이거나 담보를 추가해주세요.';
        } else if (error.message.includes('Json deserialize error')) {
          // 서버의 JSON 파싱 에러 처리
          if (error.message.includes('expected f64')) {
            errorMessage =
              '숫자 형식이 올바르지 않습니다. 입력값을 확인해주세요.';
          } else if (error.message.includes('unknown variant')) {
            errorMessage =
              '옵션 타입이 올바르지 않습니다. Call 또는 Put만 가능합니다.';
          } else {
            errorMessage = '입력 데이터 형식이 올바르지 않습니다.';
          }
        } else if (error.message.includes('Invalid JSON response')) {
          errorMessage =
            '서버 응답 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('unexpected end of json input')) {
          errorMessage = '서버 통신 오류가 발생했습니다. 다시 시도해주세요.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Trade Failed',
        description: errorMessage,
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
                placeholder={`Max: ${(option?.max_quantity || 0).toFixed(6)} BTC`}
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

              {/* Max 버튼 */}
              <div className="flex justify-end mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const maxQty = Math.min(
                      maxQuantity,
                      option?.max_quantity || 0
                    );
                    // 90% 정도로 안전하게 설정
                    const safeQty = maxQty * 0.9;
                    if (safeQty > 0) {
                      setQuantity(safeQty.toFixed(6));
                    }
                  }}
                  className="text-xs"
                >
                  Max (
                  {(
                    Math.min(maxQuantity, option?.max_quantity || 0) * 0.9
                  ).toFixed(6)}{' '}
                  BTC)
                </Button>
              </div>

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
