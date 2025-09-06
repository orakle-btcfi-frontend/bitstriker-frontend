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

  // 디버깅을 위한 로그
  console.log('API Request:', {
    url,
    method: config.method || 'GET',
    headers: config.headers,
    body: config.body,
  });

  const response = await fetch(url, config);

  if (!response.ok) {
    // Content-Type 확인해서 JSON 또는 텍스트로 처리
    const contentType = response.headers.get('content-type');
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

    try {
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } else {
        // 텍스트 응답 처리
        const errorText = await response.text();
        if (errorText.trim()) {
          errorMessage = errorText;
        }
      }
    } catch (parseError) {
      console.error('Error parsing error response:', parseError);
    }

    throw new Error(errorMessage);
  }

  // 응답이 비어있는 경우 처리 (content-length가 0이거나 204 No Content)
  const contentLength = response.headers.get('content-length');
  if (contentLength === '0' || response.status === 204) {
    return {} as T;
  }

  // 응답 텍스트를 먼저 확인
  const responseText = await response.text();
  if (!responseText.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(responseText);
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Response text:', responseText);
    throw new Error('Invalid JSON response from server');
  }
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
