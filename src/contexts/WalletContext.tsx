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
  switch (action.type) {
    case 'SET_WALLET':
      return {
        ...state,
        wallet: action.payload,
        isConnected: true,
        isLoading: false,
      };
    case 'DISCONNECT_WALLET':
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

  // 앱 시작시 저장된 지갑 정보 불러오기
  useEffect(() => {
    const savedWallet = loadWalletFromStorage();
    if (savedWallet) {
      dispatch({ type: 'SET_WALLET', payload: savedWallet });

      // 저장된 지갑의 잔액도 새로고침
      setTimeout(async () => {
        try {
          const sender = new MutinyNetSender();
          const balance = await sender.getBalance(savedWallet.address);
          const btcBalance = balance / 100000000;

          const updatedWallet = { ...savedWallet, balance: btcBalance };
          saveWalletToStorage(updatedWallet);
          dispatch({ type: 'SET_WALLET', payload: updatedWallet });
        } catch (error) {
          console.error('Failed to refresh saved wallet balance:', error);
        }
      }, 1000);
    }
  }, []);

  const connectWallet = (
    privateKey: string,
    addressType: AddressType = 'segwit'
  ) => {
    dispatch({ type: 'SET_LOADING', payload: true });

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
      setTimeout(async () => {
        try {
          const sender = new MutinyNetSender();
          const balance = await sender.getBalance(wallet.address);
          const btcBalance = balance / 100000000;

          const updatedWallet = { ...wallet, balance: btcBalance };
          saveWalletToStorage(updatedWallet);
          dispatch({ type: 'SET_WALLET', payload: updatedWallet });
        } catch (error) {
          console.error('Failed to fetch initial balance:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const createWallet = (addressType: AddressType = 'segwit'): WalletInfo => {
    dispatch({ type: 'SET_LOADING', payload: true });

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
      setTimeout(async () => {
        try {
          const sender = new MutinyNetSender();
          const balance = await sender.getBalance(wallet.address);
          const btcBalance = balance / 100000000;

          const updatedWallet = { ...wallet, balance: btcBalance };
          saveWalletToStorage(updatedWallet);
          dispatch({ type: 'SET_WALLET', payload: updatedWallet });
        } catch (error) {
          console.error('Failed to fetch initial balance:', error);
        }
      }, 1000);

      return wallet;
    } catch (error) {
      console.error('Failed to create wallet:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const disconnectWallet = () => {
    removeWalletFromStorage();
    dispatch({ type: 'DISCONNECT_WALLET' });
  };

  const updateBalance = (balance: number) => {
    dispatch({ type: 'UPDATE_BALANCE', payload: balance });
  };

  const refreshBalance = async () => {
    if (!state.wallet) return;

    try {
      const sender = new MutinyNetSender();
      const balance = await sender.getBalance(state.wallet.address);
      const btcBalance = balance / 100000000; // satoshis to BTC

      const updatedWallet = {
        ...state.wallet,
        balance: btcBalance,
      };

      saveWalletToStorage(updatedWallet);
      dispatch({ type: 'SET_WALLET', payload: updatedWallet });
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
