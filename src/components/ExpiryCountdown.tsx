import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  calculateTimeRemaining,
  formatTimeRemainingShort,
  getExpiryUrgencyColor,
  type TimeRemaining,
} from '@/utils/timeUtils';

interface ExpiryCountdownProps {
  expiryDate: string;
  compact?: boolean;
  showBadge?: boolean;
}

export const ExpiryCountdown = ({
  expiryDate,
  compact = false,
  showBadge = true,
}: ExpiryCountdownProps) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(
    calculateTimeRemaining(expiryDate)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(expiryDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [expiryDate]);

  const colorClass = getExpiryUrgencyColor(timeRemaining);
  const timeText = formatTimeRemainingShort(timeRemaining);

  if (compact) {
    const expiryDateObj = new Date(expiryDate);
    // UTC 기준으로 날짜 표시 (타임존 변환 방지)
    const expiryFormatted = `${
      expiryDateObj.getUTCMonth() + 1
    }월 ${expiryDateObj.getUTCDate()}일`;
    return (
      <div className="text-xs">
        <div className={`font-mono ${colorClass}`}>{timeText}</div>
        <div className="text-gray-500 text-xs">{expiryFormatted}</div>
      </div>
    );
  }

  if (showBadge) {
    return (
      <Badge
        variant={timeRemaining.isExpired ? 'destructive' : 'outline'}
        className={`text-xs font-mono ${colorClass} border-current`}
      >
        {timeText}
      </Badge>
    );
  }

  const totalHours = timeRemaining.days * 24 + timeRemaining.hours;

  return (
    <div className={`font-bold text-6xl font-mono ${colorClass}`}>
      {timeRemaining.isExpired
        ? `만료됨`
        : `${totalHours.toString().padStart(2, '0')}:${timeRemaining.minutes
            .toString()
            .padStart(2, '0')}:${timeRemaining.seconds
            .toString()
            .padStart(2, '0')}`}
    </div>
  );
};
