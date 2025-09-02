import { useBTCOptions } from '@/hooks/api/useBTCOptions';
import { useBTCPriceChange } from '@/hooks/api/useBTCPrice';
import { ExpiryCountdown } from '@/components/ExpiryCountdown';

const ApiTestPage = () => {
  const { data: priceData, isLoading: isPriceLoading } = useBTCPriceChange();
  const { data: optionsData, isLoading: isOptionsLoading } = useBTCOptions({
    limit: 10,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-foreground">
        API 연동 테스트
      </h1>

      {/* BTC 가격 */}
      <div className="bg-card rounded-lg shadow-md p-6 mb-6 border">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          BTC 가격 (CoinGecko API)
        </h2>
        {isPriceLoading ? (
          <p className="text-muted-foreground">로딩 중...</p>
        ) : priceData ? (
          <div>
            <p className="text-2xl font-bold text-green-500">
              ${priceData.price.toLocaleString()}
            </p>
            <p
              className={`text-lg ${
                priceData.change24h >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              24시간 변화: {priceData.change24h.toFixed(2)}%
            </p>
          </div>
        ) : (
          <p className="text-red-500">가격 데이터를 불러올 수 없습니다.</p>
        )}
      </div>

      {/* 만료 시간 카운트다운 테스트 */}
      <div className="bg-card rounded-lg shadow-md p-6 mb-6 border">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          실시간 만료 시간 카운트다운
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded">
            <h3 className="font-medium mb-2 text-foreground">1분 후 만료</h3>
            <ExpiryCountdown
              expiryDate={new Date(Date.now() + 60 * 1000).toISOString()}
              compact={false}
            />
          </div>
          <div className="text-center p-4 bg-muted/50 rounded">
            <h3 className="font-medium mb-2 text-foreground">1시간 후 만료</h3>
            <ExpiryCountdown
              expiryDate={new Date(Date.now() + 60 * 60 * 1000).toISOString()}
              compact={false}
            />
          </div>
          <div className="text-center p-4 bg-muted/50 rounded">
            <h3 className="font-medium mb-2 text-foreground">7일 후 만료</h3>
            <ExpiryCountdown
              expiryDate={new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000
              ).toISOString()}
              compact={false}
            />
          </div>
          <div className="text-center p-4 bg-muted/50 rounded">
            <h3 className="font-medium mb-2 text-foreground">
              7일 전 만료 (음수)
            </h3>
            <ExpiryCountdown
              expiryDate={new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000
              ).toISOString()}
              compact={false}
            />
          </div>
        </div>
      </div>

      {/* BTC 옵션 */}
      <div className="bg-card rounded-lg shadow-md p-6 border">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          BTC 옵션 데이터 (백엔드 API)
        </h2>
        {isOptionsLoading ? (
          <p className="text-muted-foreground">로딩 중...</p>
        ) : optionsData ? (
          <div>
            <p className="mb-4 text-foreground">
              총 {optionsData.length}개의 옵션
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="px-4 py-2 text-foreground">ID</th>
                    <th className="px-4 py-2 text-foreground">Strike</th>
                    <th className="px-4 py-2 text-foreground">Call Premium</th>
                    <th className="px-4 py-2 text-foreground">Put Premium</th>
                    <th className="px-4 py-2 text-foreground">Call IV</th>
                    <th className="px-4 py-2 text-foreground">Put IV</th>
                    <th className="px-4 py-2 text-foreground">Expiry (Raw)</th>
                    <th className="px-4 py-2 text-foreground">
                      Expiry (Formatted)
                    </th>
                    <th className="px-4 py-2 text-foreground">Time Left</th>
                  </tr>
                </thead>
                <tbody>
                  {optionsData.slice(0, 5).map((option) => (
                    <tr key={option.id} className="border-b border-border">
                      <td className="px-4 py-2 text-foreground text-sm">
                        {option.id}
                      </td>
                      <td className="px-4 py-2 text-foreground">
                        ${option.strike.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-foreground">
                        ${option.call_premium.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-foreground">
                        ${option.put_premium.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-foreground">
                        {(option.call_iv * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 text-foreground">
                        {(option.put_iv * 100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 text-foreground text-xs">
                        {option.expiry}
                      </td>
                      <td className="px-4 py-2 text-foreground">
                        {new Date(option.expiry).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          timeZone: 'UTC',
                        })}
                      </td>
                      <td className="px-4 py-2">
                        <ExpiryCountdown
                          expiryDate={option.expiry}
                          compact={true}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-red-500">옵션 데이터를 불러올 수 없습니다.</p>
        )}
      </div>
    </div>
  );
};

export default ApiTestPage;
