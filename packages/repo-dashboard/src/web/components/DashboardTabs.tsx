import React, { useState, useEffect } from 'react';

export interface DashboardTab {
  id: string;
  label: string;
  icon: string;
  component: React.ComponentType<any>;
  badge?: number;
  disabled?: boolean;
}

interface DashboardTabsProps {
  tabs: DashboardTab[];
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
  persistSelection?: boolean;
}

export default function DashboardTabs({
  tabs,
  defaultTab = tabs[0]?.id,
  onTabChange,
  persistSelection = true,
}: DashboardTabsProps) {
  const storageKey = 'dashboard-selected-tab';
  const [selectedTab, setSelectedTab] = useState<string>(() => {
    if (persistSelection) {
      const stored = localStorage.getItem(storageKey);
      return stored || defaultTab;
    }
    return defaultTab;
  });

  useEffect(() => {
    if (persistSelection) {
      localStorage.setItem(storageKey, selectedTab);
    }
    onTabChange?.(selectedTab);
  }, [selectedTab, persistSelection, onTabChange]);

  const activeTab = tabs.find(t => t.id === selectedTab);
  const ActiveComponent = activeTab?.component;

  return (
    <div className="dashboard-tabs-container">
      <div className="dashboard-tabs-header">
        <div className="dashboard-tabs-list" role="tablist">
          {tabs.map(tab => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={selectedTab === tab.id}
              aria-controls={`tab-panel-${tab.id}`}
              disabled={tab.disabled}
              onClick={() => !tab.disabled && setSelectedTab(tab.id)}
              className={`dashboard-tab ${selectedTab === tab.id ? 'active' : ''} ${tab.disabled ? 'disabled' : ''}`}
              title={tab.label}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="tab-badge">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="dashboard-tabs-content">
        {activeTab && (
          <div
            id={`tab-panel-${activeTab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTab.id}`}
            className="tab-panel"
          >
            <ActiveComponent />
          </div>
        )}
      </div>
    </div>
  );
}

