import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest, API_ENDPOINTS } from '@/lib/api';
import {
  User,
  UserTradeHistory,
  UserPortfolio,
  CreateUserTradeRequest,
} from '@/types/api';

// 사용자 정보 조회
export const useUserInfo = (userId: number) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => apiRequest<User>(`${API_ENDPOINTS.USERS}/${userId}`),
    staleTime: 5 * 60 * 1000, // 5분 캐시
    enabled: !!userId,
  });
};

// 사용자 거래 내역 조회
export const useUserTradeHistories = (params?: {
  userId?: number;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['user-trade-histories', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.userId)
        searchParams.append('user_id', params.userId.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.offset)
        searchParams.append('offset', params.offset.toString());

      const endpoint = searchParams.toString()
        ? `${API_ENDPOINTS.USER_TRADE_HISTORIES}?${searchParams.toString()}`
        : API_ENDPOINTS.USER_TRADE_HISTORIES;

      return apiRequest<UserTradeHistory[]>(endpoint);
    },
    staleTime: 10000, // 10초 캐시
  });
};

// 사용자 포트폴리오 조회
export const useUserPortfolios = (params?: {
  userId?: number;
  limit?: number;
  offset?: number;
}) => {
  return useQuery({
    queryKey: ['user-portfolios', params],
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params?.userId)
        searchParams.append('user_id', params.userId.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.offset)
        searchParams.append('offset', params.offset.toString());

      const endpoint = searchParams.toString()
        ? `${API_ENDPOINTS.USER_PORTFOLIOS}?${searchParams.toString()}`
        : API_ENDPOINTS.USER_PORTFOLIOS;

      return apiRequest<UserPortfolio[]>(endpoint);
    },
    staleTime: 10000, // 10초 캐시
  });
};

// 거래 생성
export const useCreateUserTrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tradeData: CreateUserTradeRequest) =>
      apiRequest(API_ENDPOINTS.USER_TRADE_HISTORIES, {
        method: 'POST',
        body: tradeData,
      }),
    onSuccess: () => {
      // 거래 생성 후 관련 데이터 무효화
      queryClient.invalidateQueries({ queryKey: ['user-trade-histories'] });
      queryClient.invalidateQueries({ queryKey: ['user-portfolios'] });
      queryClient.invalidateQueries({ queryKey: ['btc-options'] });
    },
  });
};

// 포트폴리오 통계 계산 유틸리티
export const calculatePortfolioStats = (
  portfolios: UserPortfolio[],
  tradeHistories: UserTradeHistory[]
) => {
  // 새로운 API에서는 포트폴리오 데이터가 이미 계산되어 있음
  const mainPortfolio = portfolios[0];

  if (!mainPortfolio) {
    return {
      totalValue: 0,
      activePositions: 0,
      todayPnL: 0,
      totalPnL: 0,
      totalTrades: 0,
      returnRate: 0,
    };
  }

  // API에서 제공하는 계산된 값들 사용
  const totalValue = mainPortfolio.total_portfolio_value;
  const activePositions = mainPortfolio.active_options_count;
  const todayPnL = mainPortfolio.today_pnl;
  const totalPnL = mainPortfolio.realized_pnl + mainPortfolio.unrealized_pnl;
  const totalTrades = mainPortfolio.total_trades_count;

  // 수익률 계산
  const returnRate = totalValue > 0 ? (totalPnL / totalValue) * 100 : 0;

  return {
    totalValue,
    activePositions,
    todayPnL,
    totalPnL,
    totalTrades,
    returnRate,
  };
};
