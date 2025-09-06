// API 클라이언트 설정
const API_BASE_URL = '/api-btcfi';

// 새로운 BTC Options API 서버 설정
const NEW_API_BASE_URL = '/api-new';

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

// 새로운 BTC Options API 요청 함수
export async function newApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${NEW_API_BASE_URL}${endpoint}`;

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
        errorData.message ||
        `API request failed: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
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

// 새로운 BTC Options API 엔드포인트
export const NEW_API_ENDPOINTS = {
  HEALTH: '/health',
  OPTIONS_TABLE: '/optionsTable',
  CONTRACT: '/contract',
  CONTRACTS: '/contracts',
  DELTA: '/delta',
  TOP_BANNER: '/topBanner',
  MARKET_HIGHLIGHTS: '/marketHighlights',
  TOP_GAINERS: '/topGainers',
  TOP_VOLUME: '/topVolume',
} as const;
