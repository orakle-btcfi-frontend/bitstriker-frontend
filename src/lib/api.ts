// API 클라이언트 설정
const API_BASE_URL = '/api-btcfi';

// API 요청을 위한 기본 fetch 함수
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error ||
        `API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.data || data; // 백엔드 응답 구조에 맞게 조정
}

// API 엔드포인트 상수들
export const API_ENDPOINTS = {
  BTC_OPTIONS: '/btc-options',
  BTC_OPTIONS_ACTIVE: '/btc-options/active',
  BTC_OPTIONS_BY_SYMBOL: (symbol: string) => `/btc-options/symbol/${symbol}`,
  BTC_OPTIONS_BY_EXPIRY: '/btc-options/expiry',
  USERS: '/users',
  USER_PORTFOLIOS: '/user-portfolios',
  USER_TRADE_HISTORIES: '/user-trade-histories',
} as const;
