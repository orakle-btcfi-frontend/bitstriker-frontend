import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { WalletState, WalletAction, WalletInfo } from '@/types/wallet';
import {
  BitcoinWalletGenerator,
  AddressType,
  NetworkType,
} from '@/utils/bitcoinWallet';
import { MutinyNetSender } from '@/utils/mutinyNetSender';

interface WalletContextType {
  state: WalletState;
  connectWallet: (privateKey: string, addressType?: AddressType) => void;
  createWallet: (addressType?: AddressType) => WalletInfo;
  disconnectWallet: () => void;
  updateBalance: (balance: number) => void;
  refreshBalance: () => Promise<void>;
  getNetworkInfo: () => any;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const initialState: WalletState = {
  wallet: null,
  isConnected: false,
  isLoading: false,
};

function walletReducer(state: WalletState, action: WalletAction): WalletState {
  console.log('🔄 Wallet Reducer:', action.type, action);
  switch (action.type) {
    case 'SET_WALLET':
      console.log('✅ 지갑 설정:', action.payload);
      return {
        ...state,
        wallet: action.payload,
        isConnected: true,
        isLoading: false,
      };
    case 'DISCONNECT_WALLET':
      console.log('❌ 지갑 연결 해제');
      return {
        ...state,
        wallet: null,
        isConnected: false,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'UPDATE_BALANCE':
      return {
        ...state,
        wallet: state.wallet
          ? { ...state.wallet, balance: action.payload }
          : null,
      };
    default:
      return state;
  }
}

// Bitcoin 지갑 생성기 인스턴스 (MutinyNet 사용)
const walletGenerator = new BitcoinWalletGenerator('mutinynet');

// 지갑 정보를 localStorage에 저장/불러오기
const WALLET_STORAGE_KEY = 'btcfi_wallet';

function saveWalletToStorage(wallet: WalletInfo) {
  localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
}

function loadWalletFromStorage(): WalletInfo | null {
  try {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function removeWalletFromStorage() {
  localStorage.removeItem(WALLET_STORAGE_KEY);
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(walletReducer, initialState);

  // setTimeout ID들을 저장하여 연결 해제 시 취소할 수 있도록 함
  const timeoutIds = React.useRef<NodeJS.Timeout[]>([]);

  // 연결 해제 플래그 - 비동기 작업 중단용
  const isDisconnected = React.useRef<boolean>(false);

  // 앱 시작시 저장된 지갑 정보 불러오기
  useEffect(() => {
    console.log('🚀 앱 시작 - localStorage 확인');
    const savedWallet = loadWalletFromStorage();
    console.log('💾 저장된 지갑:', savedWallet);
    if (savedWallet) {
      console.log('🔄 저장된 지갑 복원 중...');
      dispatch({ type: 'SET_WALLET', payload: savedWallet });

      // 저장된 지갑의 잔액도 새로고침
      const timeoutId = setTimeout(async () => {
        try {
          console.log('⏰ useEffect setTimeout 실행됨');
          // 지갑이 연결 해제되었는지 확인
          const currentWallet = loadWalletFromStorage();
          console.log('⏰ useEffect localStorage 확인:', currentWallet);
          if (!currentWallet) {
            console.log('🚫 useEffect: 지갑이 연결 해제되어 잔액 조회 취소');
            return;
          }

          const sender = new MutinyNetSender();
          const balance = await sender.getBalance(savedWallet.address);
          const btcBalance = balance / 100000000;

          // 비동기 작업 완료 후 연결 해제 플래그 재확인
          if (isDisconnected.current) {
            console.log(
              '🚫 useEffect: 비동기 작업 완료 후 연결 해제 상태 확인됨'
            );
            return;
          }

          const updatedWallet = { ...savedWallet, balance: btcBalance };
          saveWalletToStorage(updatedWallet);
          dispatch({ type: 'SET_WALLET', payload: updatedWallet });
        } catch (error) {
          console.error('Failed to refresh saved wallet balance:', error);
        }
      }, 1000);

      timeoutIds.current.push(timeoutId);
    }
  }, []);

  const connectWallet = (
    privateKey: string,
    addressType: AddressType = 'segwit'
  ) => {
    dispatch({ type: 'SET_LOADING', payload: true });

    // 연결 해제 플래그 초기화
    isDisconnected.current = false;

    try {
      // 실제 Bitcoin 지갑 복원
      const generatedWallet = walletGenerator.restoreWallet(
        privateKey,
        addressType
      );

      const wallet: WalletInfo = {
        address: generatedWallet.address,
        privateKey: generatedWallet.privateKey,
        balance: 0,
        createdAt: new Date().toISOString(),
      };

      saveWalletToStorage(wallet);
      dispatch({ type: 'SET_WALLET', payload: wallet });

      // 지갑 연결 후 잔액 조회
      const timeoutId = setTimeout(async () => {
        try {
          console.log('⏰ connectWallet setTimeout 실행됨');
          // 지갑이 연결 해제되었는지 확인
          const currentWallet = loadWalletFromStorage();
          console.log('⏰ connectWallet localStorage 확인:', currentWallet);
          if (!currentWallet) {
            console.log(
              '🚫 connectWallet: 지갑이 연결 해제되어 잔액 조회 취소'
            );
            return;
          }

          const sender = new MutinyNetSender();
          const balance = await sender.getBalance(wallet.address);
          const btcBalance = balance / 100000000;

          // 비동기 작업 완료 후 연결 해제 플래그 재확인
          if (isDisconnected.current) {
            console.log(
              '🚫 connectWallet: 비동기 작업 완료 후 연결 해제 상태 확인됨'
            );
            return;
          }

          const updatedWallet = { ...wallet, balance: btcBalance };
          saveWalletToStorage(updatedWallet);
          dispatch({ type: 'SET_WALLET', payload: updatedWallet });
        } catch (error) {
          console.error('Failed to fetch initial balance:', error);
        }
      }, 1000);

      timeoutIds.current.push(timeoutId);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const createWallet = (addressType: AddressType = 'segwit'): WalletInfo => {
    dispatch({ type: 'SET_LOADING', payload: true });

    // 연결 해제 플래그 초기화
    isDisconnected.current = false;

    try {
      // 실제 Bitcoin 지갑 생성
      const generatedWallet = walletGenerator.generateWallet(addressType);

      const wallet: WalletInfo = {
        address: generatedWallet.address,
        privateKey: generatedWallet.privateKey,
        balance: 0,
        createdAt: new Date().toISOString(),
      };

      saveWalletToStorage(wallet);
      dispatch({ type: 'SET_WALLET', payload: wallet });

      // 지갑 생성 후 잔액 조회
      const timeoutId = setTimeout(async () => {
        try {
          console.log('⏰ createWallet setTimeout 실행됨');
          // 지갑이 연결 해제되었는지 확인
          const currentWallet = loadWalletFromStorage();
          console.log('⏰ createWallet localStorage 확인:', currentWallet);
          if (!currentWallet) {
            console.log('🚫 createWallet: 지갑이 연결 해제되어 잔액 조회 취소');
            return;
          }

          const sender = new MutinyNetSender();
          const balance = await sender.getBalance(wallet.address);
          const btcBalance = balance / 100000000;

          // 비동기 작업 완료 후 연결 해제 플래그 재확인
          if (isDisconnected.current) {
            console.log(
              '🚫 createWallet: 비동기 작업 완료 후 연결 해제 상태 확인됨'
            );
            return;
          }

          const updatedWallet = { ...wallet, balance: btcBalance };
          saveWalletToStorage(updatedWallet);
          dispatch({ type: 'SET_WALLET', payload: updatedWallet });
        } catch (error) {
          console.error('Failed to fetch initial balance:', error);
        }
      }, 1000);

      timeoutIds.current.push(timeoutId);

      return wallet;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const disconnectWallet = () => {
    console.log('🔌 지갑 연결 해제 시작');
    console.log(
      '🔌 현재 localStorage:',
      localStorage.getItem(WALLET_STORAGE_KEY)
    );

    // 연결 해제 플래그 설정 - 실행 중인 비동기 작업 중단용
    isDisconnected.current = true;
    console.log('🚩 연결 해제 플래그 설정');

    // 모든 대기 중인 setTimeout 취소
    console.log('⏰ 대기 중인 타이머 개수:', timeoutIds.current.length);
    timeoutIds.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
      console.log('⏰ 타이머 취소됨:', timeoutId);
    });
    timeoutIds.current = []; // 배열 초기화

    removeWalletFromStorage();
    console.log(
      '🔌 localStorage 삭제 후:',
      localStorage.getItem(WALLET_STORAGE_KEY)
    );
    dispatch({ type: 'DISCONNECT_WALLET' });
    console.log('🔌 지갑 연결 해제 완료');
  };

  const updateBalance = (balance: number) => {
    dispatch({ type: 'UPDATE_BALANCE', payload: balance });
  };

  const refreshBalance = async () => {
    if (!state.wallet) return;

    console.log('🔄 refreshBalance 시작');

    // 연결 해제 플래그 체크
    if (isDisconnected.current) {
      console.log('🚫 refreshBalance: 연결 해제 상태로 잔액 새로고침 취소');
      return;
    }

    try {
      const sender = new MutinyNetSender();
      const balance = await sender.getBalance(state.wallet.address);
      const btcBalance = balance / 100000000; // satoshis to BTC

      // 비동기 작업 완료 후 연결 해제 플래그 재확인
      if (isDisconnected.current) {
        console.log(
          '🚫 refreshBalance: 비동기 작업 완료 후 연결 해제 상태 확인됨'
        );
        return;
      }

      const updatedWallet = {
        ...state.wallet,
        balance: btcBalance,
      };

      saveWalletToStorage(updatedWallet);
      dispatch({ type: 'SET_WALLET', payload: updatedWallet });
      console.log('✅ refreshBalance 완료');
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  const getNetworkInfo = () => {
    return walletGenerator.getNetworkInfo();
  };

  return (
    <WalletContext.Provider
      value={{
        state,
        connectWallet,
        createWallet,
        disconnectWallet,
        updateBalance,
        refreshBalance,
        getNetworkInfo,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
