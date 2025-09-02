import { http, HttpResponse } from 'msw';
import { BTCOption } from '@/types/api';

// 목 데이터
const mockBTCOptions: BTCOption[] = [
  {
    id: 1,
    symbol: 'BTC',
    strike: 120000,
    expiry: '2024-12-31T23:59:59.000Z',
    call_delta: 0.65,
    call_iv: 45.2,
    call_premium: 2500.0,
    put_delta: 0.35,
    put_iv: 47.8,
    put_premium: 1800.0,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 2,
    symbol: 'BTC',
    strike: 125000,
    expiry: '2024-12-31T23:59:59.000Z',
    call_delta: 0.45,
    call_iv: 42.1,
    call_premium: 1200.0,
    put_delta: 0.55,
    put_iv: 44.3,
    put_premium: 3200.0,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 3,
    symbol: 'BTC',
    strike: 115000,
    expiry: '2024-12-31T23:59:59.000Z',
    call_delta: 0.85,
    call_iv: 38.5,
    call_premium: 4200.0,
    put_delta: 0.15,
    put_iv: 40.2,
    put_premium: 800.0,
    is_active: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z',
  },
];

export const handlers = [
  // BTC 옵션 조회 (심볼별)
  http.get(
    'https://jungho.dev/api-btcfi/btc-options/symbol/:symbol',
    ({ params }) => {
      const { symbol } = params;

      if (symbol === 'BTC') {
        return HttpResponse.json({
          data: mockBTCOptions,
        });
      }

      return HttpResponse.json({
        data: [],
      });
    }
  ),

  // 활성 BTC 옵션 조회
  http.get('https://jungho.dev/api-btcfi/btc-options/active', () => {
    return HttpResponse.json({
      data: mockBTCOptions.filter(option => option.is_active),
    });
  }),

  // 모든 BTC 옵션 조회
  http.get('https://jungho.dev/api-btcfi/btc-options', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    const paginatedOptions = mockBTCOptions.slice(offset, offset + limit);

    return HttpResponse.json({
      data: paginatedOptions,
      meta: {
        total: mockBTCOptions.length,
        limit,
        offset,
      },
    });
  }),

  // 거래 생성
  http.post(
    'https://jungho.dev/api-btcfi/user-trade-histories',
    async ({ request }) => {
      const body = await request.json();

      return HttpResponse.json(
        {
          data: {
            id: Math.floor(Math.random() * 1000),
            ...body,
            trade_status: 'pending',
            total_value: (body as any).quantity * (body as any).price,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        },
        { status: 201 }
      );
    }
  ),

  // BTC 가격 API (CoinGecko Mock)
  http.get('https://api.coingecko.com/api/v3/simple/price', ({ request }) => {
    const url = new URL(request.url);
    const ids = url.searchParams.get('ids');
    const includeChange = url.searchParams.get('include_24hr_change');

    if (ids?.includes('bitcoin')) {
      const response: any = {
        bitcoin: {
          usd: 121500 + Math.random() * 1000, // 121,500 ~ 122,500
        },
      };

      if (includeChange) {
        response.bitcoin.usd_24h_change = (Math.random() - 0.5) * 10; // -5% ~ +5%
      }

      return HttpResponse.json(response);
    }

    return HttpResponse.json({});
  }),

  // 에러 시뮬레이션을 위한 핸들러
  http.get('https://jungho.dev/api-btcfi/btc-options/error', () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),
];
