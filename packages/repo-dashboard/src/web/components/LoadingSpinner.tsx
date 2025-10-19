import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'medium' 
}) => {
  const sizeMap = {
    small: '30px',
    medium: '50px',
    large: '80px',
  };

  const spinnerSize = sizeMap[size];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: '4px solid var(--border-color)',
          borderTop: '4px solid var(--accent-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      {message && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export const SkeletonLoader: React.FC<{ count?: number; height?: string }> = ({ 
  count = 3, 
  height = '20px' 
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            height,
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '4px',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;

