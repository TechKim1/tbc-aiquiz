import { useEffect, useRef, useState } from 'react';

interface Props {
  totalSeconds: number;
  onTimeout: () => void;
  paused?: boolean;
}

export default function CountdownTimer({ totalSeconds, onTimeout, paused }: Props) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    setRemaining(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setTimeout(() => onTimeoutRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [totalSeconds, paused]);

  const pct = remaining / totalSeconds;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct);

  let color = '#22C55E';
  let textColor = 'text-green-600';
  let shake = false;

  if (pct <= 0.1) {
    color = '#EF4444';
    textColor = 'text-red-600';
    shake = true;
  } else if (pct <= 0.5) {
    color = '#EAB308';
    textColor = 'text-yellow-600';
  }

  return (
    <div className={`relative inline-flex items-center justify-center ${shake ? 'animate-shake' : ''}`}>
      <svg width="96" height="96" className="-rotate-90">
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="8"
        />
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className={shake ? 'animate-pulse-border' : ''}
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
        />
      </svg>
      <span className={`absolute text-2xl font-bold ${textColor}`}>{remaining}</span>
    </div>
  );
}
