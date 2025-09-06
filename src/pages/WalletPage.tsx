import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { useWallet } from '@/contexts/WalletContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Bitcoin,
  TrendingUp,
  Clock,
  RefreshCw,
  Loader2,
  ExternalLink,
  Search,
} from 'lucide-react';

interface WalletData {
  lightning: number;
  confirmed: number;
  unconfirmed: number;
  federation: number;
}

interface Transaction {
  id: string;
  type: 'receive' | 'send';
  amount: number;
  timestamp: string;
  status: 'confirmed' | 'pending';
  description?: string;
}

const WalletPage = () => {
  const { state } = useWallet();

  // 연결된 지갑이 없으면 기본 주소 사용
  const walletAddress =
    state.wallet?.address || 'tb1qch7l3vuuzdldhjx908f40cpjxu0pzkhtd3j3m5';

  const [balance, setBalance] = useState<WalletData>({
    lightning: 0,
    confirmed: 0,
    unconfirmed: 0,
    federation: 0,
  });
  const [balanceView, setBalanceView] = useState<'sats' | 'fiat'>('sats');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [btcPrice, setBtcPrice] = useState(0);

  // 실제 비트코인 주소를 사용한 지갑 데이터 가져오기
  const fetchWalletData = async () => {
    try {
      // 1. mutinynet API를 통한 주소 정보 및 mempool.space에서 BTC 가격
      let btcPriceUSD = 0;
      let addressData = null;

      try {
        const [priceResponse, addressResponse] = await Promise.all([
          fetch('https://mempool.space/api/v1/prices'),
          fetch(`https://mutinynet.com/api/address/${walletAddress}`),
        ]);

        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          btcPriceUSD = priceData.USD;
          setBtcPrice(btcPriceUSD);
          console.log('✅ BTC 가격 업데이트:', btcPriceUSD);
        }

        if (addressResponse.ok) {
          addressData = await addressResponse.json();
          console.log('✅ 주소 데이터:', addressData);
        } else {
          console.error(
            '❌ 주소 API 응답 실패:',
            addressResponse.status,
            addressResponse.statusText
          );
        }
      } catch (error) {
        console.error('❌ API 호출 실패:', error);
      }

      // 2. 실제 주소 데이터를 기반으로 한 지갑 잔액 설정
      let realBalance: WalletData = {
        lightning: 0,
        confirmed: 0,
        unconfirmed: 0,
        federation: 0,
      };

      if (addressData) {
        // 실제 주소의 잔액 데이터 사용
        realBalance = {
          // 실제 확인된 잔액 (satoshis)
          confirmed:
            addressData.chain_stats.funded_txo_sum -
            addressData.chain_stats.spent_txo_sum,

          // 미확인 잔액 (mempool의 잔액)
          unconfirmed:
            addressData.mempool_stats.funded_txo_sum -
            addressData.mempool_stats.spent_txo_sum,

          // Lightning과 Federation은 온체인 주소로는 조회 불가
          lightning: 0,
          federation: 0,
        };

        console.log('✅ Mutinynet 주소 잔액 데이터:', {
          address: walletAddress,
          confirmed: realBalance.confirmed,
          unconfirmed: realBalance.unconfirmed,
          totalTxs: addressData.chain_stats.tx_count,
          balance: realBalance,
        });
      } else {
        console.warn('⚠️ 주소 데이터를 가져올 수 없음');
        return; // 주소 데이터 없으면 업데이트 하지 않음
      }

      // 3. 실제 주소의 거래 내역 가져오기
      let realTransactions: Transaction[] = [];

      try {
        // 실제 주소의 거래 내역 가져오기 (mutinynet API 사용)
        const txHistoryResponse = await fetch(
          `https://mutinynet.com/api/address/${walletAddress}/txs`
        );

        if (txHistoryResponse.ok) {
          const txHistory = await txHistoryResponse.json();

          // 최대 5개의 최근 거래만 표시
          realTransactions = txHistory
            .slice(0, 5)
            .map((tx: any, index: number) => {
              // 이 주소가 송신자인지 수신자인지 판단
              const isReceive = tx.vout.some(
                (output: any) => output.scriptpubkey_address === walletAddress
              );

              // 거래 금액 계산
              let amount = 0;
              if (isReceive) {
                // 받은 금액 (이 주소로 온 output들의 합)
                amount = tx.vout
                  .filter(
                    (output: any) =>
                      output.scriptpubkey_address === walletAddress
                  )
                  .reduce((sum: number, output: any) => sum + output.value, 0);
              } else {
                // 보낸 금액 (이 주소에서 나간 input들의 합, 마이너스로 표시)
                amount = -tx.vin
                  .filter(
                    (input: any) =>
                      input.prevout?.scriptpubkey_address === walletAddress
                  )
                  .reduce(
                    (sum: number, input: any) => sum + input.prevout.value,
                    0
                  );
              }

              return {
                id: tx.txid, // 전체 txid 저장
                type: isReceive ? 'receive' : 'send',
                amount: amount,
                timestamp: tx.status.block_time
                  ? new Date(tx.status.block_time * 1000).toISOString()
                  : new Date().toISOString(),
                status: tx.status.confirmed ? 'confirmed' : 'pending',
                description: `${isReceive ? 'Received' : 'Sent'} transaction`,
              };
            });

          console.log('✅ Mutinynet 거래 내역 로드:', {
            address: walletAddress,
            totalTxs: txHistory.length,
            displayedTxs: realTransactions.length,
            transactions: realTransactions,
          });
        } else {
          console.error(
            '❌ 거래 내역 API 응답 실패:',
            txHistoryResponse.status,
            txHistoryResponse.statusText
          );
        }
      } catch (error) {
        console.error('❌ 거래 내역 가져오기 실패:', error);
      }

      setBalance(realBalance);
      setTransactions(realTransactions);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWalletData();
  };

  useEffect(() => {
    if (state.isConnected && state.wallet) {
      fetchWalletData();
    }
  }, [state.wallet?.address]); // 지갑 주소가 변경될 때마다 데이터 새로고침

  const totalBalance = balance.confirmed + balance.unconfirmed;

  const formatSats = (sats: number) => {
    return sats.toLocaleString();
  };

  const formatFiat = (sats: number) => {
    // 실시간 BTC 가격 사용 (mempool.space API에서 가져온 데이터)
    const btcAmount = sats / 100000000; // sats to BTC
    const fiatAmount = btcAmount * btcPrice;
    return `$${fiatAmount.toFixed(2)}`;
  };

  const formatBTC = (sats: number) => {
    const btcAmount = sats / 100000000; // sats to BTC
    return btcAmount.toFixed(8).replace(/\.?0+$/, '');
  };

  const cycleBalanceView = () => {
    if (balanceView === 'sats') setBalanceView('fiat');
    else setBalanceView('sats');
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 지갑이 연결되지 않은 경우
  if (!state.isConnected || !state.wallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Navigation />
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Wallet className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Wallet Not Connected
            </h2>
            <p className="text-muted-foreground mb-6">
              Connect your wallet to view balance and transaction history.
            </p>
            <p className="text-sm text-muted-foreground">
              Click the "Connect Wallet" button in the header to get started.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Navigation />
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="ml-3 text-muted-foreground">
              Loading wallet data...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Navigation />

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              title="Go to Home"
            >
              <div className="p-2 bg-primary/20 rounded-lg">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div className="text-lg font-bold text-foreground">
                BitStriker
              </div>
            </Link>
            <div className="w-px h-8 bg-border"></div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Wallet</h1>
              <p className="text-muted-foreground">
                {state.wallet?.address
                  ? `${state.wallet.address.slice(
                      0,
                      8
                    )}...${state.wallet.address.slice(-6)} • MutinyNet`
                  : 'MutinyNet Wallet'}
                {btcPrice > 0 && ` • BTC Price: $${btcPrice.toLocaleString()}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() =>
                window.open(
                  `https://mutinynet.com/ko/address/${walletAddress}`,
                  '_blank'
                )
              }
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              title="View on Mutinynet Explorer"
            >
              <Search className="w-4 h-4" />
              <span>Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Total Balance Card */}
        <Card className="glass-card mb-8">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Total Balance
              </p>
              <button
                onClick={cycleBalanceView}
                className="group flex items-center justify-center space-x-2 mx-auto p-2 rounded-lg hover:bg-muted/20 transition-colors"
              >
                <div className="text-4xl font-bold text-foreground">
                  {balanceView === 'sats' && (
                    <>
                      {formatSats(totalBalance)}{' '}
                      <span className="text-2xl text-primary">sats</span>
                      <span className="text-lg text-muted-foreground ml-2">
                        ({formatBTC(totalBalance)} BTC)
                      </span>
                    </>
                  )}
                  {balanceView === 'fiat' && (
                    <>
                      <span className="text-[hsl(var(--trading-green))]">
                        {formatFiat(totalBalance)}
                      </span>
                      <span className="text-lg text-muted-foreground ml-2">
                        ({formatBTC(totalBalance)} BTC)
                      </span>
                    </>
                  )}
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 주소 정보 */}
        <Card className="glass-card mb-8">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-muted/20 rounded-lg">
                  <Bitcoin className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Wallet Address
                  </p>
                  <p className="font-mono text-sm text-foreground break-all">
                    {walletAddress}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(walletAddress);
                }}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1 text-xs"
                title="Copy address"
              >
                <span>Copy</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Balance Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                <div className="w-2 h-2 bg-[hsl(var(--trading-green))] rounded-full"></div>
                <span>Confirmed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-bold text-foreground">
                {balanceView === 'sats' ? (
                  <>
                    {formatSats(balance.confirmed)}
                    <span className="text-sm text-primary ml-1">sats</span>
                  </>
                ) : (
                  formatFiat(balance.confirmed)
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Unconfirmed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl font-bold text-foreground">
                {balanceView === 'sats' ? (
                  <>
                    {formatSats(balance.unconfirmed)}
                    <span className="text-sm text-primary ml-1">sats</span>
                  </>
                ) : (
                  formatFiat(balance.unconfirmed)
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Recent Transactions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/30 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`p-2 rounded-full ${
                        tx.type === 'receive'
                          ? 'bg-[hsl(var(--trading-green))]/20 text-[hsl(var(--trading-green))]'
                          : 'bg-[hsl(var(--trading-red))]/20 text-[hsl(var(--trading-red))]'
                      }`}
                    >
                      {tx.type === 'receive' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {tx.description ||
                          (tx.type === 'receive' ? 'Receive' : 'Send')}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-muted-foreground">
                          {formatTimestamp(tx.timestamp)}
                        </div>
                        {tx.id && tx.id.length > 8 && (
                          <Button
                            onClick={() =>
                              window.open(
                                `https://mutinynet.com/ko/tx/${tx.id}`,
                                '_blank'
                              )
                            }
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary hover:underline"
                            title={`View transaction: ${tx.id.slice(0, 8)}...`}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-bold ${
                        tx.type === 'receive'
                          ? 'text-[hsl(var(--trading-green))]'
                          : 'text-[hsl(var(--trading-red))]'
                      }`}
                    >
                      {tx.type === 'receive' ? '+' : ''}
                      {formatSats(Math.abs(tx.amount))} sats
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <Badge
                        variant={
                          tx.status === 'confirmed' ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {tx.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletPage;
