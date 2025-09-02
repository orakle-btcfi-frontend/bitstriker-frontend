import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  days: number;
}

export const CountdownTimer = ({ days }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const targetTime = Date.now() + (days * 24 * 60 * 60 * 1000);
    
    const updateTimer = () => {
      const now = Date.now();
      const difference = targetTime - now;
      
      if (difference > 0) {
        const totalSeconds = Math.floor(difference / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        
        setTimeLeft({ hours, minutes, seconds });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [days]);

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  return (
    <div className="text-6xl font-mono font-bold text-blue-500 tracking-wider">
      {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
    </div>
  );
};