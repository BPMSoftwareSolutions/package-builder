import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  variant = 'secondary',
  disabled = false,
  loading = false,
  size = 'medium'
}) => {
  return (
    <button
      className={`action-button action-button-${variant} action-button-${size}`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
    >
      {loading ? (
        <span className="action-button-spinner" />
      ) : (
        Icon && <Icon size={size === 'small' ? 14 : size === 'large' ? 20 : 16} />
      )}
      <span className="action-button-label">{label}</span>
    </button>
  );
};

