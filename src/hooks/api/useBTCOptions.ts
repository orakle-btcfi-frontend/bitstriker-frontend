import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, API_ENDPOINTS } from '@/lib/api';
import {
  BTCOption,
  BTCOptionsQueryParams,
  CreateUserTradeRequest,
  OptionData,
} from '@/types/api';

// BTC 옵션 목록 조회
export const useBTCOptions = (params?: BTCOptionsQueryParams) => {
  return useQuery({
    queryKey: ['btc-options', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.offset)
        searchParams.append('offset', params.offset.toString());

      const endpoint = searchParams.toString()
        ? `${API_ENDPOINTS.BTC_OPTIONS}?${searchParams.toString()}`
        : API_ENDPOINTS.BTC_OPTIONS;

      return apiRequest<BTCOption[]>(endpoint);
    },
    staleTime: 5000, // 5초 동안 캐시 유지
  });
};

// 활성화된 BTC 옵션 조회
export const useActiveBTCOptions = () => {
  return useQuery({
    queryKey: ['btc-options', 'active'],
    queryFn: () => apiRequest<BTCOption[]>(API_ENDPOINTS.BTC_OPTIONS_ACTIVE),
    staleTime: 5000,
  });
};

// 심볼별 BTC 옵션 조회
export const useBTCOptionsBySymbol = (symbol: string) => {
  return useQuery({
    queryKey: ['btc-options', 'symbol', symbol],
    queryFn: () =>
      apiRequest<BTCOption[]>(API_ENDPOINTS.BTC_OPTIONS_BY_SYMBOL(symbol)),
    staleTime: 5000,
    enabled: !!symbol,
  });
};

// 만료일별 BTC 옵션 조회
export const useBTCOptionsByExpiry = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['btc-options', 'expiry', startDate, endDate],
    queryFn: () => {
      const searchParams = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
      });
      return apiRequest<BTCOption[]>(
        `${API_ENDPOINTS.BTC_OPTIONS_BY_EXPIRY}?${searchParams.toString()}`
      );
    },
    staleTime: 5000,
    enabled: !!startDate && !!endDate,
  });
};

// 거래 생성 뮤테이션
export const useCreateTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tradeData: CreateUserTradeRequest) =>
      apiRequest(API_ENDPOINTS.USER_TRADE_HISTORIES, {
        method: 'POST',
        body: JSON.stringify(tradeData),
      }),
    onSuccess: () => {
      // 거래 생성 후 관련 데이터 무효화
      queryClient.invalidateQueries({ queryKey: ['user-trade-histories'] });
      queryClient.invalidateQueries({ queryKey: ['user-portfolios'] });
    },
  });
};

// BTCOption 데이터를 프론트엔드에서 사용하는 OptionData 형식으로 변환
export const transformBTCOptionsToOptionData = (
  btcOptions: BTCOption[]
): OptionData[] => {
  return btcOptions.map(option => ({
    id: option.id,
    strike: option.strike,
    expiry: option.expiry,
    call: {
      mark: option.call_premium,
      iv: option.call_iv,
      delta: option.call_delta,
    },
    put: {
      mark: option.put_premium,
      iv: option.put_iv,
      delta: option.put_delta,
    },
  }));
};
