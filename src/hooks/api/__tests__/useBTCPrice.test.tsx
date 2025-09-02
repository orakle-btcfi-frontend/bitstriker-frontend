import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useBTCPrice, useBTCPriceChange } from '../useBTCPrice'

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

describe('useBTCPrice', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('should fetch BTC price successfully', async () => {
    const { result } = renderHook(() => useBTCPrice(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(typeof result.current.data).toBe('number')
    expect(result.current.data).toBeGreaterThan(0)
  })

  it('should handle loading state', () => {
    const { result } = renderHook(() => useBTCPrice(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })
})

describe('useBTCPriceChange', () => {
  let wrapper: ReturnType<typeof createWrapper>

  beforeEach(() => {
    wrapper = createWrapper()
  })

  it('should fetch BTC price with change data successfully', async () => {
    const { result } = renderHook(() => useBTCPriceChange(), { wrapper })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toBeDefined()
    expect(result.current.data).toHaveProperty('price')
    expect(result.current.data).toHaveProperty('change24h')
    
    expect(typeof result.current.data!.price).toBe('number')
    expect(typeof result.current.data!.change24h).toBe('number')
    expect(result.current.data!.price).toBeGreaterThan(0)
  })

  it('should handle loading state', () => {
    const { result } = renderHook(() => useBTCPriceChange(), { wrapper })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })
})
