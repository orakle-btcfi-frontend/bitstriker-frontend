import { useState, useEffect } from 'react';

interface RealTimeCountdownProps {
  targetDate: Date;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const RealTimeCountdown = ({
  targetDate,
  className = '',
}: RealTimeCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const calculateTimeLeft = (): TimeLeft => {
    const now = new Date().getTime();
    const target = targetDate.getTime();
    const difference = target - now;

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
      };
    }

    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // 초기값 설정
    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [targetDate]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const isExpired =
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0;

  if (isExpired) {
    return (
      <div className={`text-center ${className}`}>
        <div className="text-4xl font-bold text-red-500 mb-2">EXPIRED</div>
        <div className="text-lg text-muted-foreground">
          This option has expired
        </div>
      </div>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      {/* 큰 숫자 표시 */}
      <div className="flex items-center justify-center space-x-6 mb-4">
        {timeLeft.days > 0 && (
          <div className="text-center">
            <div className="text-6xl font-bold text-emerald-500 mb-1">
              {formatNumber(timeLeft.days)}
            </div>
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Days
            </div>
          </div>
        )}

        <div className="text-center">
          <div className="text-6xl font-bold text-emerald-500 mb-1">
            {formatNumber(timeLeft.hours)}
          </div>
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Hours
          </div>
        </div>

        <div className="text-4xl font-bold text-emerald-400 self-start mt-3">
          :
        </div>

        <div className="text-center">
          <div className="text-6xl font-bold text-emerald-500 mb-1">
            {formatNumber(timeLeft.minutes)}
          </div>
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Minutes
          </div>
        </div>

        <div className="text-4xl font-bold text-emerald-400 self-start mt-3">
          :
        </div>

        <div className="text-center">
          <div className="text-6xl font-bold text-emerald-500 mb-1">
            {formatNumber(timeLeft.seconds)}
          </div>
          <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Seconds
          </div>
        </div>
      </div>
    </div>
  );
};
