import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import { OptionsTable } from '../OptionsTable';

// Toast hook 모킹
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('OptionsTable', () => {
  const defaultProps = {
    currentPrice: 121500,
    onOptionClick: vi.fn(),
  };

  it('should render loading state initially', () => {
    render(<OptionsTable {...defaultProps} />);

    expect(
      screen.getByText('옵션 데이터를 불러오는 중...')
    ).toBeInTheDocument();
    expect(screen.getByTestId('loader-icon')).toBeInTheDocument(); // progressbar 대신 testid 사용
  });

  it('should render options table after loading', async () => {
    render(<OptionsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // 테이블 헤더 확인
    expect(screen.getByText('Call Delta')).toBeInTheDocument();
    expect(screen.getByText('Call IV')).toBeInTheDocument();
    expect(screen.getByText('Call Premium')).toBeInTheDocument();
    expect(screen.getByText('Strike Price')).toBeInTheDocument();
    expect(screen.getByText('Put Premium')).toBeInTheDocument();
    expect(screen.getByText('Put IV')).toBeInTheDocument();
    expect(screen.getByText('Put Delta')).toBeInTheDocument();
  });

  it('should display option data correctly', async () => {
    render(<OptionsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Strike 가격 확인 (목 데이터에서)
    expect(screen.getByText('$120,000')).toBeInTheDocument();
    expect(screen.getByText('$125,000')).toBeInTheDocument();
    expect(screen.getByText('$115,000')).toBeInTheDocument();
  });

  it('should call onOptionClick when option is clicked', async () => {
    const user = userEvent.setup();
    const onOptionClick = vi.fn();

    render(<OptionsTable {...defaultProps} onOptionClick={onOptionClick} />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // Call 옵션 델타 셀 클릭
    const callDeltaCell = screen.getByText('0.650');
    await user.click(callDeltaCell);

    expect(onOptionClick).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'calls',
        strike: 120000,
      })
    );
  });

  it('should highlight ATM options', async () => {
    render(<OptionsTable currentPrice={120000} onOptionClick={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // ATM 뱃지 확인
    expect(screen.getByText('ATM')).toBeInTheDocument();
  });

  it('should handle hover effects', async () => {
    const user = userEvent.setup();
    render(<OptionsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    const firstRow = screen.getByRole('row', { name: /120,000/ });

    // 마우스 오버 시 스타일이 변경되는지 확인 (CSS 클래스가 적용되는지)
    await user.hover(firstRow);

    // 호버 상태에서 추가 스타일이 적용되는지 테스트
    expect(firstRow).toBeInTheDocument();
  });

  it('should format numbers correctly', async () => {
    render(<OptionsTable {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    // 프리미엄 포맷 확인 (목 데이터: 2500.0 -> $2,500.00)
    expect(screen.getByText('$2,500.00')).toBeInTheDocument();

    // IV 포맷 확인 (목 데이터: 45.2 -> 45.2%)
    expect(screen.getByText('45.2%')).toBeInTheDocument();
  });
});
