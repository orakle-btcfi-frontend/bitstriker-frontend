import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newApiRequest, NEW_API_ENDPOINTS } from '@/lib/api';
import {
  NewOptionsTableResponse,
  NewContractRequest,
  NewContract,
  TopBannerData,
  MarketHighlight,
  TopGainer,
  TopVolumeItem,
  HealthResponse,
  OptionData,
} from '@/types/api';

// 헬스체크
export const useNewApiHealth = () => {
  return useQuery({
    queryKey: ['new-api-health'],
    queryFn: () => newApiRequest<HealthResponse>(NEW_API_ENDPOINTS.HEALTH),
    staleTime: 30000, // 30초 동안 캐시 유지
  });
};

// 옵션 테이블 조회 (110개 옵션 자동 생성)
export const useNewOptionsTable = () => {
  return useQuery({
    queryKey: ['new-options-table'],
    queryFn: () =>
      newApiRequest<NewOptionsTableResponse[]>(NEW_API_ENDPOINTS.OPTIONS_TABLE),
    staleTime: 5000, // 5초 동안 캐시 유지
    refetchInterval: 10000, // 10초마다 자동 갱신
  });
};

// 옵션 계약 생성
export const useCreateContract = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (contractData: NewContractRequest) =>
      newApiRequest<void>(NEW_API_ENDPOINTS.CONTRACT, {
        method: 'POST',
        body: JSON.stringify(contractData),
      }),
    onSuccess: () => {
      // 계약 생성 후 관련 데이터 갱신
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio-delta'] });
      queryClient.invalidateQueries({ queryKey: ['top-banner'] });
    },
  });
};

// 계약 목록 조회
export const useContracts = () => {
  return useQuery({
    queryKey: ['contracts'],
    queryFn: () => newApiRequest<NewContract[]>(NEW_API_ENDPOINTS.CONTRACTS),
    staleTime: 5000,
  });
};

// 포트폴리오 델타 조회
export const usePortfolioDelta = () => {
  return useQuery({
    queryKey: ['portfolio-delta'],
    queryFn: () => newApiRequest<number>(NEW_API_ENDPOINTS.DELTA),
    staleTime: 5000,
    refetchInterval: 15000, // 15초마다 자동 갱신
  });
};

// 시장 통계 배너
export const useTopBanner = () => {
  return useQuery({
    queryKey: ['top-banner'],
    queryFn: () => newApiRequest<TopBannerData>(NEW_API_ENDPOINTS.TOP_BANNER),
    staleTime: 10000, // 10초 동안 캐시 유지
    refetchInterval: 30000, // 30초마다 자동 갱신
  });
};

// 시장 하이라이트 (24시간 거래량 상위 6개)
export const useMarketHighlights = () => {
  return useQuery({
    queryKey: ['market-highlights'],
    queryFn: () =>
      newApiRequest<MarketHighlight[]>(NEW_API_ENDPOINTS.MARKET_HIGHLIGHTS),
    staleTime: 10000,
    refetchInterval: 60000, // 1분마다 자동 갱신
  });
};

// 상위 수익률 상품 (24시간 수익률 상위 5개)
export const useTopGainers = () => {
  return useQuery({
    queryKey: ['top-gainers'],
    queryFn: () => newApiRequest<TopGainer[]>(NEW_API_ENDPOINTS.TOP_GAINERS),
    staleTime: 10000,
    refetchInterval: 60000, // 1분마다 자동 갱신
  });
};

// 상위 거래량 상품 (USD 거래량 상위 5개)
export const useTopVolume = () => {
  return useQuery({
    queryKey: ['top-volume'],
    queryFn: () => newApiRequest<TopVolumeItem[]>(NEW_API_ENDPOINTS.TOP_VOLUME),
    staleTime: 10000,
    refetchInterval: 60000, // 1분마다 자동 갱신
  });
};

// 새로운 API 데이터를 기존 OptionData 형식으로 변환하는 함수
export const transformNewOptionsToOptionData = (
  newOptions: NewOptionsTableResponse[]
): OptionData[] => {
  // Strike 가격별로 그룹화
  const groupedByStrike = newOptions.reduce(
    (acc, option) => {
      const key = option.strike_price;
      if (!acc[key]) {
        acc[key] = {
          strike: option.strike_price,
          call: { mark: 0, iv: 0, delta: 0 },
          put: { mark: 0, iv: 0, delta: 0 },
          expiry: option.expire,
          id: key, // Strike 가격을 ID로 사용
        };
      }

      if (option.side === 'Call') {
        acc[key].call = {
          mark: parseFloat(option.premium),
          iv: option.iv,
          delta: option.delta,
          max_quantity: parseFloat(option.max_quantity),
        };
      } else {
        acc[key].put = {
          mark: parseFloat(option.premium),
          iv: option.iv,
          delta: option.delta,
          max_quantity: parseFloat(option.max_quantity),
        };
      }

      return acc;
    },
    {} as Record<number, OptionData>
  );

  return Object.values(groupedByStrike).sort((a, b) => a.strike - b.strike);
};

// 만료일별로 옵션을 필터링하는 함수
export const filterOptionsByExpiry = (
  options: NewOptionsTableResponse[],
  expiry: string
): NewOptionsTableResponse[] => {
  return options.filter(option => option.expire === expiry);
};

// 현재가 기준으로 옵션을 필터링하는 함수 (±15% 범위)
export const filterOptionsByPrice = (
  options: NewOptionsTableResponse[],
  currentPrice: number,
  range: number = 0.15
): NewOptionsTableResponse[] => {
  const priceRange = currentPrice * range;
  return options.filter(
    option => Math.abs(option.strike_price - currentPrice) <= priceRange
  );
};
