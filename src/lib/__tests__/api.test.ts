import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { apiRequest, API_ENDPOINTS } from '../api';

describe('apiRequest', () => {
  it('should make successful GET request', async () => {
    const result = await apiRequest('/btc-options/symbol/BTC');

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle POST request with body', async () => {
    const tradeData = {
      user_id: 1,
      option_id: 1,
      trade_type: 'buy',
      quantity: 1,
      price: 2500,
    };

    const result = await apiRequest('/user-trade-histories', {
      method: 'POST',
      body: JSON.stringify(tradeData),
    });

    expect(result).toBeDefined();
    expect(result).toHaveProperty('id');
    expect(result).toMatchObject(tradeData);
  });

  it('should handle API errors', async () => {
    // 에러 핸들러 추가
    server.use(
      http.get('https://jungho.dev/api-btcfi/error-endpoint', () => {
        return HttpResponse.json({ error: 'Test error' }, { status: 400 });
      })
    );

    await expect(apiRequest('/error-endpoint')).rejects.toThrow('Test error');
  });

  it('should handle network errors', async () => {
    // 네트워크 에러 시뮬레이션
    server.use(
      http.get('https://jungho.dev/api-btcfi/network-error', () => {
        return HttpResponse.error();
      })
    );

    await expect(apiRequest('/network-error')).rejects.toThrow();
  });

  it('should include correct headers', async () => {
    let requestHeaders: Headers | undefined;

    server.use(
      http.get('https://jungho.dev/api-btcfi/test-headers', ({ request }) => {
        requestHeaders = request.headers;
        return HttpResponse.json({ data: 'success' });
      })
    );

    await apiRequest('/test-headers');

    expect(requestHeaders?.get('Content-Type')).toBe('application/json');
  });

  it('should handle custom headers', async () => {
    let requestHeaders: Headers | undefined;

    server.use(
      http.get(
        'https://jungho.dev/api-btcfi/test-custom-headers',
        ({ request }) => {
          requestHeaders = request.headers;
          return HttpResponse.json({ data: 'success' });
        }
      )
    );

    await apiRequest('/test-custom-headers', {
      headers: {
        'Custom-Header': 'test-value',
        'Content-Type': 'application/json', // 명시적으로 설정
      },
    });

    expect(requestHeaders?.get('Content-Type')).toBe('application/json');
    expect(requestHeaders?.get('Custom-Header')).toBe('test-value');
  });
});

describe('API_ENDPOINTS', () => {
  it('should have correct endpoint constants', () => {
    expect(API_ENDPOINTS.BTC_OPTIONS).toBe('/btc-options');
    expect(API_ENDPOINTS.BTC_OPTIONS_ACTIVE).toBe('/btc-options/active');
    expect(API_ENDPOINTS.BTC_OPTIONS_BY_SYMBOL('BTC')).toBe(
      '/btc-options/symbol/BTC'
    );
    expect(API_ENDPOINTS.BTC_OPTIONS_BY_EXPIRY).toBe('/btc-options/expiry');
    expect(API_ENDPOINTS.USERS).toBe('/users');
    expect(API_ENDPOINTS.USER_PORTFOLIOS).toBe('/user-portfolios');
    expect(API_ENDPOINTS.USER_TRADE_HISTORIES).toBe('/user-trade-histories');
  });
});
