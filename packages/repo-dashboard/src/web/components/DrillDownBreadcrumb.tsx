import React, { useState, useEffect } from 'react';

export interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: string;
}

interface DrillDownBreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (path: string) => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

export default function DrillDownBreadcrumb({
  items,
  onNavigate,
  onBack,
  showBackButton = true,
}: DrillDownBreadcrumbProps) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    // Initialize history from current path
    if (items.length > 0) {
      setHistory(items.map(item => item.path));
    }
  }, [items]);

  const handleNavigate = (path: string) => {
    onNavigate(path);
  };

  const handleBack = () => {
    if (history.length > 1) {
      const newHistory = history.slice(0, -1);
      setHistory(newHistory);
      onNavigate(newHistory[newHistory.length - 1]);
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <nav className="breadcrumb-container" aria-label="Breadcrumb">
      <div className="breadcrumb-content">
        {showBackButton && history.length > 1 && (
          <button
            className="breadcrumb-back-button"
            onClick={handleBack}
            aria-label="Go back"
            title="Go back"
          >
            ← Back
          </button>
        )}

        <ol className="breadcrumb-list">
          {items.map((item, index) => (
            <li key={item.path} className="breadcrumb-item">
              {index > 0 && <span className="breadcrumb-separator">/</span>}
              {index === items.length - 1 ? (
                <span className="breadcrumb-current" aria-current="page">
                  {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                  {item.label}
                </span>
              ) : (
                <button
                  className="breadcrumb-link"
                  onClick={() => handleNavigate(item.path)}
                  aria-label={`Navigate to ${item.label}`}
                >
                  {item.icon && <span className="breadcrumb-icon">{item.icon}</span>}
                  {item.label}
                </button>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}

