/**
 * 시간 관련 유틸리티 함수들
 */

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isExpired: boolean;
}

/**
 * 만료 시간까지 남은 시간을 계산합니다
 */
export function calculateTimeRemaining(
  expiryDate: string | Date
): TimeRemaining {
  const now = new Date().getTime();
  const expiry = new Date(expiryDate).getTime();
  const difference = expiry - now;

  const isExpired = difference <= 0;
  const absDifference = Math.abs(difference);

  if (isExpired) {
    const days = Math.floor(absDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (absDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
      (absDifference % (1000 * 60 * 60)) / (1000 * 60)
    );
    const seconds = Math.floor((absDifference % (1000 * 60)) / 1000);

    return {
      days: -days,
      hours: -hours,
      minutes: -minutes,
      seconds: -seconds,
      totalSeconds: Math.floor(difference / 1000), // 음수 유지
      isExpired: true,
    };
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  return {
    days,
    hours,
    minutes,
    seconds,
    totalSeconds: Math.floor(difference / 1000),
    isExpired: false,
  };
}

/**
 * 시간을 사람이 읽기 쉬운 형태로 포맷합니다
 */
export function formatTimeRemaining(timeRemaining: TimeRemaining): string {
  const { days, hours, minutes, seconds, isExpired } = timeRemaining;

  if (isExpired) {
    return '만료됨';
  }

  if (days > 0) {
    return `${days}일 ${hours}시간`;
  } else if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  } else if (minutes > 0) {
    return `${minutes}분 ${seconds}초`;
  } else {
    return `${seconds}초`;
  }
}

/**
 * 만료까지의 시간을 짧은 형태로 포맷합니다
 */
export function formatTimeRemainingShort(timeRemaining: TimeRemaining): string {
  const { days, hours, minutes, seconds, isExpired } = timeRemaining;

  if (isExpired) {
    // 음수 시간 표시
    const absDays = Math.abs(days);
    const absHours = Math.abs(hours);
    const absMinutes = Math.abs(minutes);
    const absSeconds = Math.abs(seconds);

    if (absDays > 0) {
      return `-${absDays}d ${absHours}h`;
    } else if (absHours > 0) {
      return `-${absHours}h ${absMinutes}m`;
    } else if (absMinutes > 0) {
      return `-${absMinutes}m ${absSeconds}s`;
    } else {
      return `-${absSeconds}s`;
    }
  }

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * 만료 시간에 따른 긴급도 색상을 반환합니다
 */
export function getExpiryUrgencyColor(timeRemaining: TimeRemaining): string {
  const { totalSeconds, isExpired } = timeRemaining;

  if (isExpired) {
    return 'text-red-600';
  } else if (totalSeconds < 3600) {
    // 1시간 미만
    return 'text-red-500';
  } else if (totalSeconds < 86400) {
    // 1일 미만
    return 'text-yellow-500';
  } else if (totalSeconds < 604800) {
    // 1주 미만
    return 'text-blue-500';
  } else {
    return 'text-gray-600';
  }
}

/**
 * 시간을 백분율로 변환 (0-100%)
 * 만료일까지의 전체 시간 대비 남은 시간의 비율
 */
export function getTimeRemainingPercentage(
  expiryDate: string | Date,
  createdDate: string | Date
): number {
  const now = new Date().getTime();
  const expiry = new Date(expiryDate).getTime();
  const created = new Date(createdDate).getTime();

  const totalTime = expiry - created;
  const remainingTime = expiry - now;

  if (remainingTime <= 0) return 0;
  if (remainingTime >= totalTime) return 100;

  return Math.max(0, Math.min(100, (remainingTime / totalTime) * 100));
}
