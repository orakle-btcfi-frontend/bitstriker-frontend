import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import TradePage from '../TradePage';

// 모든 하위 컴포넌트들 모킹
vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

vi.mock('@/components/PriceChart', () => ({
  PriceChart: ({ currentPrice }: { currentPrice: number }) => (
    <div data-testid="price-chart">Price Chart: {currentPrice}</div>
  ),
}));

vi.mock('@/components/CountdownTimer', () => ({
  CountdownTimer: ({ days }: { days: number }) => (
    <div data-testid="countdown-timer">Countdown: {days} days</div>
  ),
}));

vi.mock('@/components/TradingModal', () => ({
  TradingModal: ({ isOpen, option }: { isOpen: boolean; option: any }) =>
    isOpen ? (
      <div data-testid="trading-modal">Trading Modal: {option?.type}</div>
    ) : null,
}));

describe('TradePage', () => {
  it('should render main components', async () => {
    render(<TradePage />);

    // Navigation 확인
    expect(screen.getByTestId('navigation')).toBeInTheDocument();

    // 가격 로딩 상태 확인
    expect(screen.getByText('가격 정보 로딩 중...')).toBeInTheDocument();

    // 만료일 선택 버튼들이 렌더링되는지 확인
    await waitFor(() => {
      expect(screen.getByText('+1d')).toBeInTheDocument();
      expect(screen.getByText('+2d')).toBeInTheDocument();
      expect(screen.getByText('+3d')).toBeInTheDocument();
      expect(screen.getByText('+7d')).toBeInTheDocument();
      expect(screen.getByText('+14d')).toBeInTheDocument();
    });
  });

  it('should display BTC price when loaded', async () => {
    render(<TradePage />);

    // 가격이 로드된 후 확인
    await waitFor(
      () => {
        // BTC 가격이 표시되는지 확인 (목 데이터 범위: 121,500 ~ 122,500)
        expect(screen.getByText(/\$121,\d{3}|\$122,\d{3}/)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // BTCUSD 레이블 확인
    expect(screen.getByText('BTCUSD')).toBeInTheDocument();

    // 가격 변화율이 표시되는지 확인
    expect(screen.getByText(/[+-]\d+\.\d+%/)).toBeInTheDocument();
  });

  it('should handle expiry selection', async () => {
    const user = userEvent.setup();
    render(<TradePage />);

    await waitFor(() => {
      expect(screen.getByText('+1d')).toBeInTheDocument();
    });

    // 기본적으로 +1d가 선택되어 있는지 확인
    const oneDayButton = screen.getByRole('button', { name: /\+1d/ });
    expect(oneDayButton).toHaveClass('bg-primary/20');

    // +7d 버튼 클릭
    const sevenDayButton = screen.getByRole('button', { name: /\+7d/ });
    await user.click(sevenDayButton);

    // 카운트다운 타이머가 7일로 업데이트되는지 확인
    expect(screen.getByTestId('countdown-timer')).toHaveTextContent(
      'Countdown: 7 days'
    );
  });

  it('should display Time to Expiry section', async () => {
    render(<TradePage />);

    await waitFor(() => {
      expect(screen.getByText('Time to Expiry')).toBeInTheDocument();
    });

    // 카운트다운 타이머 확인
    expect(screen.getByTestId('countdown-timer')).toBeInTheDocument();

    // 만료일 뱃지 확인
    expect(screen.getByText(/Expires:/)).toBeInTheDocument();
  });

  it('should display Options Trading section', async () => {
    render(<TradePage />);

    await waitFor(() => {
      expect(screen.getByText('Options Trading')).toBeInTheDocument();
    });

    // Call/Put 헤더 확인
    expect(screen.getByText('Calls')).toBeInTheDocument();
    expect(screen.getByText('Puts')).toBeInTheDocument();
    expect(screen.getByText('Strike')).toBeInTheDocument();

    // ATM Vol 정보 확인
    expect(screen.getByText(/ATM Vol: \d+\.\d+%/)).toBeInTheDocument();
  });

  it('should handle price loading error gracefully', async () => {
    // BTC 가격 API에 에러를 발생시키는 핸들러 추가
    const { server } = await import('@/test/mocks/server');
    const { http, HttpResponse } = await import('msw');

    server.use(
      http.get('https://api.coingecko.com/api/v3/simple/price', () => {
        return HttpResponse.error();
      })
    );

    render(<TradePage />);

    await waitFor(() => {
      expect(screen.getByText('실시간 가격 업데이트 불가')).toBeInTheDocument();
    });

    // 기본 가격이 여전히 표시되는지 확인
    expect(screen.getByText('$121,608')).toBeInTheDocument();
  });

  it('should show options table loading and then content', async () => {
    render(<TradePage />);

    // OptionsTable 로딩 상태 확인
    expect(
      screen.getByText('옵션 데이터를 불러오는 중...')
    ).toBeInTheDocument();

    // 옵션 데이터가 로드된 후 테이블이 나타나는지 확인
    await waitFor(
      () => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
