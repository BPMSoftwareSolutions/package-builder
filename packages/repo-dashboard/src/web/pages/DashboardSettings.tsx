import React, { useState, useEffect } from 'react';

export interface DashboardPreferences {
  defaultTab: string;
  defaultOrg: string;
  defaultRepo?: string;
  refreshInterval: number;
  theme: 'light' | 'dark';
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  alertsEnabled: boolean;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
}

interface DashboardSettingsProps {
  onNavigate?: (page: string, data?: any) => void;
}

const DEFAULT_PREFERENCES: DashboardPreferences = {
  defaultTab: 'overview',
  defaultOrg: 'BPMSoftwareSolutions',
  refreshInterval: 60,
  theme: 'dark',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  numberFormat: 'en-US',
  alertsEnabled: true,
  notificationsEnabled: true,
  emailNotifications: false,
};

export default function DashboardSettings({ onNavigate }: DashboardSettingsProps) {
  const [preferences, setPreferences] = useState<DashboardPreferences>(DEFAULT_PREFERENCES);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load preferences from localStorage
    const stored = localStorage.getItem('dashboard-preferences');
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (err) {
        console.error('Failed to load preferences:', err);
      }
    }
  }, []);

  const handleChange = (key: keyof DashboardPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('dashboard-preferences', JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    setPreferences(DEFAULT_PREFERENCES);
    localStorage.removeItem('dashboard-preferences');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="dashboard-settings-page">
      <h1>Dashboard Settings</h1>

      {saved && (
        <div className="success-message">✅ Settings saved successfully</div>
      )}

      <div className="settings-container">
        {/* Display Settings */}
        <section className="settings-section">
          <h2>Display Settings</h2>

          <div className="setting-group">
            <label htmlFor="theme">Theme</label>
            <select
              id="theme"
              value={preferences.theme}
              onChange={e => handleChange('theme', e.target.value)}
            >
              <option value="dark">Dark Mode</option>
              <option value="light">Light Mode</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="dateFormat">Date Format</label>
            <select
              id="dateFormat"
              value={preferences.dateFormat}
              onChange={e => handleChange('dateFormat', e.target.value)}
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="timezone">Timezone</label>
            <select
              id="timezone"
              value={preferences.timezone}
              onChange={e => handleChange('timezone', e.target.value)}
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Denver">Mountain Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="numberFormat">Number Format</label>
            <select
              id="numberFormat"
              value={preferences.numberFormat}
              onChange={e => handleChange('numberFormat', e.target.value)}
            >
              <option value="en-US">1,234.56 (US)</option>
              <option value="de-DE">1.234,56 (EU)</option>
              <option value="fr-FR">1 234,56 (FR)</option>
            </select>
          </div>
        </section>

        {/* Default Settings */}
        <section className="settings-section">
          <h2>Default Settings</h2>

          <div className="setting-group">
            <label htmlFor="defaultTab">Default Tab</label>
            <select
              id="defaultTab"
              value={preferences.defaultTab}
              onChange={e => handleChange('defaultTab', e.target.value)}
            >
              <option value="overview">Overview</option>
              <option value="flow">Flow</option>
              <option value="feedback">Feedback</option>
              <option value="learning">Learning</option>
              <option value="collaboration">Collaboration</option>
            </select>
          </div>

          <div className="setting-group">
            <label htmlFor="defaultOrg">Default Organization</label>
            <input
              id="defaultOrg"
              type="text"
              value={preferences.defaultOrg}
              onChange={e => handleChange('defaultOrg', e.target.value)}
              placeholder="Organization name"
            />
          </div>

          <div className="setting-group">
            <label htmlFor="refreshInterval">Refresh Interval (seconds)</label>
            <input
              id="refreshInterval"
              type="number"
              min="10"
              max="3600"
              value={preferences.refreshInterval}
              onChange={e => handleChange('refreshInterval', parseInt(e.target.value))}
            />
          </div>
        </section>

        {/* Notification Settings */}
        <section className="settings-section">
          <h2>Notification Settings</h2>

          <div className="setting-group checkbox">
            <input
              id="alertsEnabled"
              type="checkbox"
              checked={preferences.alertsEnabled}
              onChange={e => handleChange('alertsEnabled', e.target.checked)}
            />
            <label htmlFor="alertsEnabled">Enable Alerts</label>
          </div>

          <div className="setting-group checkbox">
            <input
              id="notificationsEnabled"
              type="checkbox"
              checked={preferences.notificationsEnabled}
              onChange={e => handleChange('notificationsEnabled', e.target.checked)}
            />
            <label htmlFor="notificationsEnabled">Enable Notifications</label>
          </div>

          <div className="setting-group checkbox">
            <input
              id="emailNotifications"
              type="checkbox"
              checked={preferences.emailNotifications}
              onChange={e => handleChange('emailNotifications', e.target.checked)}
            />
            <label htmlFor="emailNotifications">Email Notifications</label>
          </div>
        </section>
      </div>

      <div className="settings-actions">
        <button className="btn-save" onClick={handleSave}>
          💾 Save Settings
        </button>
        <button className="btn-reset" onClick={handleReset}>
          🔄 Reset to Defaults
        </button>
      </div>
    </div>
  );
}

