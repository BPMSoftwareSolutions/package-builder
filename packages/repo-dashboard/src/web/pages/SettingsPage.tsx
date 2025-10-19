import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface SettingsPageProps {
  onNavigate?: (page: string, data?: any) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    organization: localStorage.getItem('defaultOrg') || 'BPMSoftwareSolutions',
    adfLocation: localStorage.getItem('adfLocation') || './adf',
    refreshInterval: parseInt(localStorage.getItem('refreshInterval') || '300000'),
    theme: theme,
  });
  const [saved, setSaved] = useState(false);

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('defaultOrg', settings.organization);
    localStorage.setItem('adfLocation', settings.adfLocation);
    localStorage.setItem('refreshInterval', settings.refreshInterval.toString());
    setTheme(settings.theme as 'light' | 'dark');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dashboard-settings.json';
    link.click();
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setSettings(imported);
      } catch (err) {
        alert('Failed to import settings');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', color: 'var(--text-primary)' }}>
        Settings
      </h1>

      {saved && (
        <div className="success">
          ✓ Settings saved successfully
        </div>
      )}

      {/* General Settings */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">General Settings</div>
        <div className="card-body">
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              Default Organization
            </label>
            <input
              type="text"
              value={settings.organization}
              onChange={(e) => handleChange('organization', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
              }}
            />
            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
              The default GitHub organization to display
            </small>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              ADF File Location
            </label>
            <input
              type="text"
              value={settings.adfLocation}
              onChange={(e) => handleChange('adfLocation', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
              }}
            />
            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
              Path to Architecture Definition Files
            </small>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              Refresh Interval (ms)
            </label>
            <input
              type="number"
              value={settings.refreshInterval}
              onChange={(e) => handleChange('refreshInterval', parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
              }}
            />
            <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
              How often to refresh data (in milliseconds)
            </small>
          </div>
        </div>
      </div>

      {/* Theme Settings */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">Theme Settings</div>
        <div className="card-body">
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '1rem',
              }}
            >
              <option value="dark">Dark (Default)</option>
              <option value="light">Light</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">Data Management</div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={handleExportSettings} className="btn btn-secondary">
              Export Settings
            </button>
            <label style={{ display: 'inline-block' }}>
              <input
                type="file"
                accept=".json"
                onChange={handleImportSettings}
                style={{ display: 'none' }}
              />
              <span className="btn btn-secondary" style={{ cursor: 'pointer' }}>
                Import Settings
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button onClick={handleSave} className="btn btn-primary">
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;

