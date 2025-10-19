import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: any) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <a href="#" className="nav-brand" onClick={() => onNavigate('dashboard')}>
          📊 Dashboard
        </a>
        <ul className="nav-links">
          <li>
            <a
              className={`nav-link ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => onNavigate('dashboard')}
            >
              Home
            </a>
          </li>
          <li>
            <a
              className={`nav-link ${currentPage === 'architecture' ? 'active' : ''}`}
              onClick={() => onNavigate('architecture')}
            >
              Architecture
            </a>
          </li>
          <li>
            <a
              className={`nav-link ${currentPage === 'metrics' ? 'active' : ''}`}
              onClick={() => onNavigate('metrics')}
            >
              Metrics
            </a>
          </li>
          <li>
            <a
              className={`nav-link ${currentPage === 'insights' ? 'active' : ''}`}
              onClick={() => onNavigate('insights')}
            >
              Insights
            </a>
          </li>
          <li>
            <a
              className={`nav-link ${currentPage === 'feedback' ? 'active' : ''}`}
              onClick={() => onNavigate('feedback')}
            >
              📡 Feedback
            </a>
          </li>
          <li>
            <a
              className={`nav-link ${currentPage === 'repos' ? 'active' : ''}`}
              onClick={() => onNavigate('repos', { org: 'BPMSoftwareSolutions' })}
            >
              Repositories
            </a>
          </li>
          <li>
            <a
              className={`nav-link ${currentPage === 'issues' ? 'active' : ''}`}
              onClick={() => onNavigate('issues', { repo: 'BPMSoftwareSolutions/package-builder' })}
            >
              Issues
            </a>
          </li>
          <li>
            <a
              className={`nav-link ${currentPage === 'packages' ? 'active' : ''}`}
              onClick={() => onNavigate('packages')}
            >
              Packages
            </a>
          </li>
          <li>
            <a
              className={`nav-link ${currentPage === 'settings' ? 'active' : ''}`}
              onClick={() => onNavigate('settings')}
            >
              ⚙️ Settings
            </a>
          </li>
          <li>
            <button
              onClick={toggleTheme}
              className="nav-link"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem 1rem',
              }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}

