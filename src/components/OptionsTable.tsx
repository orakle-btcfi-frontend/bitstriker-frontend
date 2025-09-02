import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Loader2, Clock } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  useBTCOptions,
  transformBTCOptionsToOptionData,
} from '@/hooks/api/useBTCOptions';
import { OptionData } from '@/types/api';
import { ExpiryCountdown } from '@/components/ExpiryCountdown';

interface OptionsTableProps {
  currentPrice: number;
  onTrade?: (trade: {
    type: 'calls' | 'puts';
    strike: number;
    price: number;
    quantity: number;
  }) => void;
  onOptionClick?: (option: any) => void;
  selectedExpiry?: string; // 선택된 만료일 (ISO 형식)
}

// OptionData 타입은 이제 @/types/api에서 import

export const OptionsTable = ({
  currentPrice,
  onTrade,
  onOptionClick,
  selectedExpiry,
}: OptionsTableProps) => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const { toast } = useToast();

  // BTC 옵션 데이터를 API에서 가져오기 (현재가에 맞게 조정)
  const {
    data: btcOptionsData,
    isLoading,
    error,
  } = useBTCOptions({ limit: 100 }); // 더 많은 옵션을 가져와서 필터링

  // API 데이터를 프론트엔드 형식으로 변환하고 현재 가격에 맞게 조정
  const allOptions = btcOptionsData
    ? transformBTCOptionsToOptionData(btcOptionsData)
        .map((option) => {
          // 백엔드 Strike 가격을 현재 BTC 가격 기준으로 스케일링
          // 백엔드 데이터: 30,000 ~ 80,000 범위
          // 현재 가격: ~115,000
          const scaleFactor = currentPrice / 55000; // 55,000은 백엔드 데이터의 중간값
          const adjustedStrike = Math.round(option.strike * scaleFactor);

          return {
            ...option,
            strike: adjustedStrike,
          };
        })
        .filter((option) => {
          // 현재가 근처 ±15% 범위의 옵션들만 표시
          const strikeRange = currentPrice * 0.15;
          const withinStrikeRange =
            Math.abs(option.strike - currentPrice) <= strikeRange;

          // 선택된 만료일이 있으면 해당 만료일로 필터링
          if (selectedExpiry) {
            return withinStrikeRange && option.expiry === selectedExpiry;
          }

          return withinStrikeRange;
        })
        .sort((a, b) => a.strike - b.strike) // Strike 가격순으로 정렬
    : [];

  // 필터링된 옵션들 표시 (최대 15개)
  const options = allOptions.slice(0, 15);

  // 디버깅용 로그
  console.log('API Data:', btcOptionsData?.length || 0, 'options');
  console.log('Transformed Options:', options.length, 'options');
  if (options.length > 0) {
    console.log('Sample option:', options[0]);
  }

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" data-testid="loader-icon" />
        <span className="ml-2">옵션 데이터를 불러오는 중...</span>
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>옵션 데이터를 불러오는 중 오류가 발생했습니다.</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (options.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>현재 사용 가능한 옵션이 없습니다.</p>
      </div>
    );
  }

  const handleOptionClick = (
    optionData: any,
    optionType: 'calls' | 'puts',
    index: number
  ) => {
    setSelectedRow(index);
    if (onOptionClick) {
      onOptionClick({ ...optionData, type: optionType });
    }
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  const getRowColor = (strike: number) => {
    return Math.abs(strike - currentPrice) < 1000 ? 'bg-primary/5' : 'bg-card';
  };

  const getCellBackgroundColor = (
    strike: number,
    optionType: 'call' | 'put'
  ) => {
    if (optionType === 'call' && strike > currentPrice) {
      return 'bg-[hsl(var(--trading-green))]/10';
    }
    if (optionType === 'put' && strike < currentPrice) {
      return 'bg-[hsl(var(--trading-red))]/10';
    }
    return '';
  };

  return (
    <div className="overflow-x-auto rounded-xl">
      <table className="trading-table w-full">
        <thead>
          <tr>
            <th className="text-center text-[hsl(var(--trading-green))]">
              Call Delta
            </th>
            <th className="text-center text-[hsl(var(--trading-green))]">
              Call IV
            </th>
            <th className="text-center text-[hsl(var(--trading-green))]">
              Call Premium
            </th>
            <th className="text-center font-semibold">Strike Price</th>
            <th className="text-center text-[hsl(var(--trading-red))]">
              Put Premium
            </th>
            <th className="text-center text-[hsl(var(--trading-red))]">
              Put IV
            </th>
            <th className="text-center text-[hsl(var(--trading-red))]">
              Put Delta
            </th>
            <th className="text-center text-blue-600">
              <div className="flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                만료시간
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {options.map((option, index) => (
            <tr
              key={option.strike}
              className={`transition-all duration-200 ${getRowColor(
                option.strike
              )} ${
                hoveredRow === index
                  ? 'bg-[hsl(var(--table-hover))] scale-[1.01] shadow-md'
                  : ''
              }`}
              onMouseEnter={() => setHoveredRow(index)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              {/* Call Options - Delta, IV, Premium */}
              <td
                className={`text-center font-medium cursor-pointer hover:bg-[hsl(var(--trading-green))]/20 transition-colors bg-[hsl(var(--trading-green))]/5 ${getCellBackgroundColor(
                  option.strike,
                  'call'
                )}`}
                onClick={() =>
                  handleOptionClick(
                    { ...option.call, strike: option.strike },
                    'calls',
                    index
                  )
                }
              >
                {formatNumber(option.call.delta, 3)}
              </td>
              <td
                className={`text-center font-medium cursor-pointer hover:bg-[hsl(var(--trading-green))]/20 transition-colors bg-[hsl(var(--trading-green))]/5 ${getCellBackgroundColor(
                  option.strike,
                  'call'
                )}`}
                onClick={() =>
                  handleOptionClick(
                    { ...option.call, strike: option.strike },
                    'calls',
                    index
                  )
                }
              >
                <span className="price-yellow">
                  {formatNumber(option.call.iv, 1)}%
                </span>
              </td>
              <td
                className={`text-center font-medium cursor-pointer hover:bg-[hsl(var(--trading-green))]/20 transition-colors bg-[hsl(var(--trading-green))]/5 ${getCellBackgroundColor(
                  option.strike,
                  'call'
                )}`}
                onClick={() =>
                  handleOptionClick(
                    { ...option.call, strike: option.strike },
                    'calls',
                    index
                  )
                }
              >
                <span className="price-yellow">
                  ${formatNumber(option.call.mark)}
                </span>
              </td>

              {/* Strike Price (Center) */}
              <td className="font-semibold text-center bg-muted/10">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-base">
                    ${formatNumber(option.strike, 0)}
                  </span>
                  {Math.abs(option.strike - currentPrice) < 1000 && (
                    <Badge
                      variant="outline"
                      className="text-xs px-2 py-0.5 bg-primary/10 border-primary/30 text-primary"
                    >
                      ATM
                    </Badge>
                  )}
                </div>
              </td>

              {/* Put Options - Premium, IV, Delta */}
              <td
                className={`text-center font-medium cursor-pointer hover:bg-[hsl(var(--trading-red))]/20 transition-colors bg-[hsl(var(--trading-red))]/5 ${getCellBackgroundColor(
                  option.strike,
                  'put'
                )}`}
                onClick={() =>
                  handleOptionClick(
                    { ...option.put, strike: option.strike },
                    'puts',
                    index
                  )
                }
              >
                <span className="price-yellow">
                  ${formatNumber(option.put.mark)}
                </span>
              </td>
              <td
                className={`text-center font-medium cursor-pointer hover:bg-[hsl(var(--trading-red))]/20 transition-colors bg-[hsl(var(--trading-red))]/5 ${getCellBackgroundColor(
                  option.strike,
                  'put'
                )}`}
                onClick={() =>
                  handleOptionClick(
                    { ...option.put, strike: option.strike },
                    'puts',
                    index
                  )
                }
              >
                <span className="price-yellow">
                  {formatNumber(option.put.iv, 1)}%
                </span>
              </td>
              <td
                className={`text-center font-medium cursor-pointer hover:bg-[hsl(var(--trading-red))]/20 transition-colors bg-[hsl(var(--trading-red))]/5 ${getCellBackgroundColor(
                  option.strike,
                  'put'
                )}`}
                onClick={() =>
                  handleOptionClick(
                    { ...option.put, strike: option.strike },
                    'puts',
                    index
                  )
                }
              >
                {formatNumber(option.put.delta, 3)}
              </td>

              {/* Expiry Countdown */}
              <td className="text-center bg-blue-50/30">
                <ExpiryCountdown expiryDate={option.expiry} compact={true} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
