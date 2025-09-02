export interface WalletInfo {
  address: string;
  privateKey: string;
  balance?: number;
  createdAt: string;
}

export interface WalletState {
  wallet: WalletInfo | null;
  isConnected: boolean;
  isLoading: boolean;
}

export type WalletAction =
  | { type: 'SET_WALLET'; payload: WalletInfo }
  | { type: 'DISCONNECT_WALLET' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_BALANCE'; payload: number };
