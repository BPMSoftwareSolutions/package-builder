import React from 'react';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: any) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
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
              className={`nav-link ${currentPage === 'repos' ? 'active' : ''}`}
              onClick={() => onNavigate('repos')}
            >
              Repositories
            </a>
          </li>
          <li>
            <a
              className={`nav-link ${currentPage === 'issues' ? 'active' : ''}`}
              onClick={() => onNavigate('issues')}
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
    </nav>
  );
}

