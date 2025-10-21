import React, { useState, ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  badge?: string | number;
  icon?: ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = true,
  badge,
  icon
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="collapsible-section">
      <button
        className="collapsible-section-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="collapsible-section-toggle">
          {isExpanded ? '▼' : '▶'}
        </span>
        {icon && <span className="collapsible-section-icon">{icon}</span>}
        <span className="collapsible-section-title">{title}</span>
        {badge !== undefined && (
          <span className="collapsible-section-badge">{badge}</span>
        )}
      </button>
      {isExpanded && (
        <div className="collapsible-section-content">
          {children}
        </div>
      )}
    </div>
  );
};

