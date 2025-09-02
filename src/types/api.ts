// API 응답 타입 정의

export interface BTCOption {
  id: number;
  symbol: string;
  strike: number;
  expiry: string;
  call_delta: number;
  call_iv: number;
  call_premium: number;
  put_delta: number;
  put_iv: number;
  put_premium: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  wallet_address: string;
  email?: string;
  is_active: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserTradeHistory {
  id: number;
  user_id: number;
  option_id?: number;
  trade_type: 'buy' | 'sell';
  trade_status: 'pending' | 'completed' | 'cancelled' | 'failed';
  quantity: number;
  price: number;
  total_value: number;
  fee: number;
  pnl?: number;
  notes?: string;
  transaction_hash?: string;
  executed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPortfolio {
  id: number;
  user_id: number;
  btc_balance: number;
  btc_usd_value: number;
  total_portfolio_value: number;
  unrealized_pnl: number;
  realized_pnl: number;
  today_pnl: number;
  total_trading_volume: number;
  active_options_count: number;
  total_trades_count: number;
  win_rate: number | null;
  avg_trade_size: number | null;
  last_updated_price: number | null;
  last_price_update_at: string | null;
  created_at: string;
  updated_at: string;
}

// API 요청 타입들
export interface CreateUserTradeRequest {
  user_id: number;
  option_id?: number;
  trade_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  fee?: number;
  notes?: string;
  transaction_hash?: string;
}

export interface BTCOptionsQueryParams {
  limit?: number;
  offset?: number;
  start_date?: string;
  end_date?: string;
}

// 프론트엔드에서 사용할 변환된 옵션 데이터 타입
export interface OptionData {
  strike: number;
  call: {
    mark: number;
    iv: number;
    delta: number;
  };
  put: {
    mark: number;
    iv: number;
    delta: number;
  };
  expiry: string;
  id: number;
}

// API 에러 타입
export interface ApiError {
  error: string;
  details?: string;
}
