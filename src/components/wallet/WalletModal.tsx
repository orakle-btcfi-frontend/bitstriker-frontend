import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Copy, Eye, EyeOff, Wallet, Plus, Key, Coins } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/hooks/use-toast';
import { MutinyNetSender } from '@/utils/mutinyNetSender';

interface WalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletModal({ open, onOpenChange }: WalletModalProps) {
  const {
    state,
    connectWallet,
    createWallet,
    disconnectWallet,
    refreshBalance,
    getNetworkInfo,
  } = useWallet();
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [activeTab, setActiveTab] = useState('connect');
  const [isGettingCoins, setIsGettingCoins] = useState(false);
  const networkInfo = getNetworkInfo();

  // 모달이 열릴 때 잔액 새로고침
  useEffect(() => {
    if (open && state.isConnected) {
      refreshBalance();
    }
  }, [open, state.isConnected, refreshBalance]);

  const handleCreateWallet = () => {
    try {
      const newWallet = createWallet();
      toast({
        title: '지갑이 생성되었습니다!',
        description: `${networkInfo.name} 주소: ${newWallet.address.slice(
          0,
          20
        )}...`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: '지갑 생성 실패',
        description:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleConnectWallet = () => {
    if (!privateKey.trim()) {
      toast({
        title: '오류',
        description: '개인키를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (privateKey.length !== 64) {
      toast({
        title: '오류',
        description: '올바른 개인키 형식이 아닙니다. (64자리 16진수)',
        variant: 'destructive',
      });
      return;
    }

    try {
      connectWallet(privateKey);
      toast({
        title: '지갑이 연결되었습니다!',
        description: `${networkInfo.name}에 성공적으로 연결되었습니다.`,
      });
      setPrivateKey('');
      onOpenChange(false);
    } catch (error) {
      toast({
        title: '지갑 연결 실패',
        description:
          error instanceof Error
            ? error.message
            : '올바르지 않은 개인키입니다.',
        variant: 'destructive',
      });
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    toast({
      title: '지갑 연결이 해제되었습니다.',
      description: '다시 연결하려면 개인키를 입력하세요.',
    });
    onOpenChange(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '복사됨',
      description: `${label}이(가) 클립보드에 복사되었습니다.`,
    });
  };

  const handleGetTestCoins = async () => {
    if (!state.wallet) return;

    setIsGettingCoins(true);
    try {
      const sender = new MutinyNetSender();
      const result = await sender.sendTestCoins(state.wallet.address, 1000); // 0.00001 BTC

      if (result.success) {
        toast({
          title: '테스트 코인 전송 완료!',
          description: (
            <div className="space-y-1">
              <div>0.00001 BTC가 전송되었습니다.</div>
              <div>TXID: {result.txid?.slice(0, 8)}...</div>
              {result.explorerUrl && (
                <a
                  href={result.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-700 underline text-sm"
                >
                  탐색기에서 보기 →
                </a>
              )}
            </div>
          ),
        });

        // 잔액 새로고침 (약간의 지연 후)
        setTimeout(() => {
          refreshBalance();
        }, 2000);
      } else {
        toast({
          title: '테스트 코인 전송 실패',
          description: result.error || '알 수 없는 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '테스트 코인 전송 실패',
        description:
          error instanceof Error
            ? error.message
            : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsGettingCoins(false);
    }
  };

  // 지갑이 연결된 경우 지갑 정보 표시
  if (state.isConnected && state.wallet) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              지갑 정보
            </DialogTitle>
          </DialogHeader>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">연결된 지갑</CardTitle>
              <CardDescription>
                네트워크: {networkInfo.name} | 생성일:{' '}
                {new Date(state.wallet.createdAt).toLocaleDateString('ko-KR')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">지갑 주소</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={state.wallet.address}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(state.wallet!.address, '주소')
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">개인키</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type={showPrivateKey ? 'text' : 'password'}
                    value={state.wallet.privateKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                  >
                    {showPrivateKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(state.wallet!.privateKey, '개인키')
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">잔액</Label>
                <div className="text-2xl font-bold text-primary mt-1">
                  {state.wallet.balance ? state.wallet.balance.toFixed(8).replace(/\.?0+$/, '') : '0'} BTC
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <Label className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  테스트 코인 받기
                </Label>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Admin 지갑에서 0.00001 BTC를 받을 수 있습니다.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={handleGetTestCoins}
                  disabled={isGettingCoins}
                >
                  <Coins className="w-4 h-4 mr-2" />
                  {isGettingCoins ? '전송 중...' : '테스트 코인 받기'}
                </Button>
              </div>

              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="w-full mt-6"
              >
                지갑 연결 해제
              </Button>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  }

  // 지갑이 연결되지 않은 경우 연결/생성 옵션 표시
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            지갑 연결
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="connect" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              연결하기
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              새로 만들기
            </TabsTrigger>
          </TabsList>

          <TabsContent value="connect" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">개인키로 연결</CardTitle>
                <CardDescription>
                  기존 지갑의 개인키를 입력하여 연결하세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="privateKey">개인키 (64자리 16진수)</Label>
                  <Input
                    id="privateKey"
                    type="password"
                    placeholder="개인키를 입력하세요..."
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    className="font-mono"
                  />
                </div>
                <Button
                  onClick={handleConnectWallet}
                  disabled={state.isLoading}
                  className="w-full"
                >
                  {state.isLoading ? '연결 중...' : '지갑 연결'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">새 지갑 생성</CardTitle>
                <CardDescription>
                  {networkInfo.name}용 새로운 지갑을 생성합니다. 개인키를
                  안전하게 보관하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCreateWallet}
                  disabled={state.isLoading}
                  className="w-full"
                >
                  {state.isLoading ? '생성 중...' : '새 지갑 생성'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
