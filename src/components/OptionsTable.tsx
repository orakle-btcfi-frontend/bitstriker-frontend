import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Loader2, Clock } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  useNewOptionsTable,
  transformNewOptionsToOptionData,
  filterOptionsByExpiry,
  filterOptionsByPrice,
} from '@/hooks/api/useNewBTCOptions';
import { NewOptionsTableResponse } from '@/types/api';
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
  selectedExpiry?: string; // 선택된 만료일 ("1d", "2d", "3d", "5d", "7d")
}

export const OptionsTable = ({
  currentPrice,
  onTrade,
  onOptionClick,
  selectedExpiry,
}: OptionsTableProps) => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const { toast } = useToast();

  // 새로운 BTC 옵션 데이터를 API에서 가져오기
  const { data: newOptionsData, isLoading, error } = useNewOptionsTable();

  // 새로운 API 데이터를 필터링하고 변환
  const processedOptions = newOptionsData
    ? (() => {
        let filteredOptions = newOptionsData;

        // 선택된 만료일로 필터링
        if (selectedExpiry) {
          filteredOptions = filterOptionsByExpiry(
            filteredOptions,
            selectedExpiry
          );
        }

        // 현재가 기준으로 필터링 (±15% 범위)
        filteredOptions = filterOptionsByPrice(filteredOptions, currentPrice);

        // OptionData 형식으로 변환
        return transformNewOptionsToOptionData(filteredOptions);
      })()
    : [];

  // 디버깅용 로그
  console.log('API Data:', newOptionsData?.length || 0, 'options');
  console.log('Processed Options:', processedOptions.length, 'options');
  if (processedOptions.length > 0) {
    console.log('Sample processed option:', processedOptions[0]);
    console.log(
      'Put Delta values:',
      processedOptions.map(opt => ({
        strike: opt.strike,
        putDelta: opt.put.delta,
        callDelta: opt.call.delta,
      }))
    );

    // 각 Put Delta 값 개별 출력
    processedOptions.forEach((opt, index) => {
      console.log(
        `Option ${index + 1} - Strike: $${opt.strike}, Put Delta: ${opt.put.delta}, Call Delta: ${opt.call.delta}`
      );
    });
  }

  // 로딩 상태 처리
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" data-testid="loader-icon" />
        <span className="ml-2">Loading options data...</span>
      </div>
    );
  }

  // 에러 상태 처리
  if (error) {
    return (
      <div className="text-center p-8 text-red-500">
        <p>An error occurred while loading options data.</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  // 데이터가 없는 경우
  if (processedOptions.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <p>No options currently available.</p>
        {selectedExpiry && (
          <p className="text-sm mt-2">Selected expiry: {selectedExpiry}</p>
        )}
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

  const formatBTCAmount = (amount: number) => {
    // 더 간결한 BTC 표시를 위해 소수점 자릿수 조정
    if (amount >= 0.001) {
      return amount.toFixed(6) + ' BTC';
    } else if (amount >= 0.0001) {
      return amount.toFixed(7) + ' BTC';
    } else {
      return amount.toFixed(8) + ' BTC';
    }
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

  // 만료일을 ISO 형식으로 변환 (임시로 현재 시간 + 만료일 기간)
  const convertExpiryToISO = (expire: string): string => {
    const days = parseInt(expire.replace('d', ''));
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    return expiryDate.toISOString();
  };

  return (
    <div className="overflow-x-auto rounded-xl shadow-lg scrollbar-hide">
      <table className="trading-table w-full min-w-[950px] table-fixed bg-card/50">
        <thead>
          <tr>
            <th className="text-center text-[hsl(var(--trading-green))] w-[13%]">
              Call Delta
            </th>
            <th className="text-center text-[hsl(var(--trading-green))] w-[11%]">
              Call IV
            </th>
            <th className="text-center text-[hsl(var(--trading-green))] w-[17%]">
              Call Premium
            </th>
            <th className="text-center font-semibold w-[17%]">Strike Price</th>
            <th className="text-center text-[hsl(var(--trading-red))] w-[17%]">
              Put Premium
            </th>
            <th className="text-center text-[hsl(var(--trading-red))] w-[11%]">
              Put IV
            </th>
            <th className="text-center text-[hsl(var(--trading-red))] w-[13%]">
              Put Delta
            </th>
          </tr>
        </thead>
        <tbody>
          {processedOptions.map((option, index) => (
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
                className={`text-center font-medium cursor-pointer hover:bg-[hsl(var(--trading-green))]/20 transition-colors bg-[hsl(var(--trading-green))]/5 px-3 py-3 ${getCellBackgroundColor(
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
                <span className="text-sm">
                  {formatNumber(option.call.delta, 3)}
                </span>
              </td>
              <td
                className={`text-center font-medium cursor-pointer hover:bg-[hsl(var(--trading-green))]/20 transition-colors bg-[hsl(var(--trading-green))]/5 px-3 py-3 ${getCellBackgroundColor(
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
                <span className="price-yellow text-sm">
                  {formatNumber(option.call.iv * 100, 1)}%
                </span>
              </td>
              <td
                className={`text-center font-medium cursor-pointer hover:bg-[hsl(var(--trading-green))]/20 transition-colors bg-[hsl(var(--trading-green))]/5 px-3 py-3 ${getCellBackgroundColor(
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
                <span className="price-yellow text-xs font-mono">
                  {formatBTCAmount(option.call.mark)}
                </span>
              </td>

              {/* Strike Price (Center) */}
              <td className="font-semibold text-center bg-muted/10 px-3 py-3">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <span className="text-sm font-bold">
                    ${formatNumber(option.strike, 0)}
                  </span>
                  {Math.abs(option.strike - currentPrice) < 1000 && (
                    <Badge
                      variant="outline"
                      className="text-xs px-1 py-0 bg-primary/10 border-primary/30 text-primary"
                    >
                      ATM
                    </Badge>
                  )}
                </div>
              </td>

              {/* Put Options - Premium, IV, Delta */}
              <td
                className={`text-center font-medium cursor-pointer hover:bg-[hsl(var(--trading-red))]/20 transition-colors bg-[hsl(var(--trading-red))]/5 px-3 py-3 ${getCellBackgroundColor(
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
                <span className="price-yellow text-xs font-mono">
                  {formatBTCAmount(option.put.mark)}
                </span>
              </td>
              <td
                className={`text-center font-medium cursor-pointer hover:bg-[hsl(var(--trading-red))]/20 transition-colors bg-[hsl(var(--trading-red))]/5 px-3 py-3 ${getCellBackgroundColor(
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
                <span className="price-yellow text-sm">
                  {formatNumber(option.put.iv * 100, 1)}%
                </span>
              </td>
              <td
                className={`text-center font-medium cursor-pointer hover:bg-[hsl(var(--trading-red))]/20 transition-colors bg-[hsl(var(--trading-red))]/5 px-3 py-3 ${getCellBackgroundColor(
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
                <span className="text-sm font-semibold">
                  {option.put.delta === 0
                    ? '0.000'
                    : formatNumber(option.put.delta, 3)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
