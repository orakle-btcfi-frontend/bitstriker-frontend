import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, ChevronDown } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { WalletModal } from './WalletModal';

export function WalletButton() {
  const { state, refreshBalance } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 지갑이 연결되면 잔액 새로고침 (한 번만)
  useEffect(() => {
    if (state.isConnected && state.wallet) {
      refreshBalance();
    }
  }, [state.isConnected]); // refreshBalance 의존성 제거

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (state.isConnected && state.wallet) {
    return (
      <>
        <Button
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary/10 border-primary/30 hover:bg-primary/20"
        >
          <Wallet className="w-4 h-4 text-primary" />
          <span className="font-mono text-sm">
            {formatAddress(state.wallet.address)}
          </span>
          <Badge variant="secondary" className="ml-1 px-2 py-0.5 text-xs">
            {state.wallet.balance ? state.wallet.balance.toFixed(8).replace(/\.?0+$/, '') : '0'} BTC
          </Badge>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>

        <WalletModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      </>
    );
  }

  return (
    <>
      <Button
        variant="default"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2"
        disabled={state.isLoading}
      >
        <Wallet className="w-4 h-4" />
        {state.isLoading ? '연결 중...' : '지갑 연결'}
      </Button>

      <WalletModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
