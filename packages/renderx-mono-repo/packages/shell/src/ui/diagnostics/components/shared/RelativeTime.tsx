import React, { useState, useEffect } from 'react';

interface RelativeTimeProps {
  timestamp: string | number | Date;
  updateInterval?: number; // in milliseconds
}

export const RelativeTime: React.FC<RelativeTimeProps> = ({
  timestamp,
  updateInterval = 60000 // Update every minute by default
}) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(prev => prev + 1);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    } else if (diffDay < 7) {
      return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getAbsoluteTime = (date: Date): string => {
    return date.toLocaleString();
  };

  const date = new Date(timestamp);
  const relativeTime = getRelativeTime(date);
  const absoluteTime = getAbsoluteTime(date);

  return (
    <span className="relative-time" title={absoluteTime}>
      {relativeTime}
    </span>
  );
};

