import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { 
  useBTCOptions, 
  useActiveBTCOptions, 
  useBTCOptionsBySymbol,
  transformBTCOptionsToOptionData 
} from '../useBTCOptions'

// 테스트용 QueryClient Wrapper
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useBTCOptions', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('should fetch BTC options successfully', async () => {
    const { result } = renderHook(() => useBTCOptions(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data)).toBe(true)
  })

  it('should fetch BTC options with pagination parameters', async () => {
    const { result } = renderHook(
      () => useBTCOptions({ limit: 5, offset: 0 }), 
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data!.length).toBeLessThanOrEqual(5)
  })
})

describe('useActiveBTCOptions', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('should fetch active BTC options successfully', async () => {
    const { result } = renderHook(() => useActiveBTCOptions(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data)).toBe(true)
    
    // 모든 옵션이 활성 상태인지 확인
    result.current.data!.forEach(option => {
      expect(option.is_active).toBe(true)
    })
  })
})

describe('useBTCOptionsBySymbol', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('should fetch BTC options by symbol successfully', async () => {
    const { result } = renderHook(
      () => useBTCOptionsBySymbol('BTC'), 
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(Array.isArray(result.current.data)).toBe(true)
    
    // 모든 옵션이 BTC 심볼인지 확인
    result.current.data!.forEach(option => {
      expect(option.symbol).toBe('BTC')
    })
  })

  it('should not fetch when symbol is empty', () => {
    const { result } = renderHook(
      () => useBTCOptionsBySymbol(''), 
      { wrapper }
    )

    expect(result.current.isFetching).toBe(false)
  })
})

describe('transformBTCOptionsToOptionData', () => {
  it('should transform BTC options correctly', () => {
    const mockBTCOptions = [
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
      }
    ]

    const result = transformBTCOptionsToOptionData(mockBTCOptions)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 1,
      strike: 120000,
      expiry: '2024-12-31T23:59:59.000Z',
      call: {
        mark: 2500.0,
        iv: 45.2,
        delta: 0.65,
      },
      put: {
        mark: 1800.0,
        iv: 47.8,
        delta: 0.35,
      },
    })
  })

  it('should handle empty array', () => {
    const result = transformBTCOptionsToOptionData([])
    expect(result).toEqual([])
  })
})
