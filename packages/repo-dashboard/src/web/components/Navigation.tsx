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
        {/* Left Section: Brand */}
        <div className="nav-section nav-left">
          <a href="#" className="nav-brand" onClick={() => onNavigate('dashboard')}>
            📊 RenderX CI/CD Dashboard
          </a>
        </div>

        {/* Middle Section: Main Navigation Menu */}
        <div className="nav-section nav-middle">
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
                className={`nav-link ${currentPage === 'flow' ? 'active' : ''}`}
                onClick={() => onNavigate('flow')}
              >
                Flow
              </a>
            </li>
            <li>
              <a
                className={`nav-link ${currentPage === 'learning' ? 'active' : ''}`}
                onClick={() => onNavigate('learning')}
              >
                Learning
              </a>
            </li>
            <li>
              <a
                className={`nav-link ${currentPage === 'collaboration' ? 'active' : ''}`}
                onClick={() => onNavigate('collaboration')}
              >
                Collaboration
              </a>
            </li>
            <li>
              <a
                className={`nav-link ${currentPage === 'conductor-logs' ? 'active' : ''}`}
                onClick={() => onNavigate('conductor-logs')}
              >
                Conductor Logs
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
          </ul>
        </div>

        {/* Right Section: Utility Controls */}
        <div className="nav-section nav-right">
          <ul className="nav-links nav-utilities">
            <li>
              <a
                className={`nav-link ${currentPage === 'settings' ? 'active' : ''}`}
                onClick={() => onNavigate('settings')}
              >
                ⚙️
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
      </div>
    </nav>
  );
}

