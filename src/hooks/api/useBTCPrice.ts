import { useQuery } from '@tanstack/react-query';

// 실제 BTC 가격을 가져오는 외부 API (CoinGecko 등)
const BTC_PRICE_API =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd';

interface BTCPriceResponse {
  bitcoin: {
    usd: number;
  };
}

export const useBTCPrice = () => {
  return useQuery({
    queryKey: ['btc-price'],
    queryFn: async (): Promise<number> => {
      const response = await fetch(BTC_PRICE_API);
      if (!response.ok) {
        throw new Error('Failed to fetch BTC price');
      }
      const data: BTCPriceResponse = await response.json();
      return data.bitcoin.usd;
    },
    staleTime: 30000, // 30초 동안 캐시 유지
    refetchInterval: 60000, // 1분마다 자동 업데이트
  });
};

// 가격 변화율을 계산하는 함수 (24시간 전 가격과 비교)
export const useBTCPriceChange = () => {
  return useQuery({
    queryKey: ['btc-price-change'],
    queryFn: async (): Promise<{ price: number; change24h: number }> => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch BTC price change');
      }
      const data = await response.json();
      return {
        price: data.bitcoin.usd,
        change24h: data.bitcoin.usd_24h_change,
      };
    },
    staleTime: 30000,
    refetchInterval: 60000,
  });
};
