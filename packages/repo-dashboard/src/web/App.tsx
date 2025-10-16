import React, { useState } from 'react';
import './styles/index.css';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import RepoStatus from './pages/RepoStatus';
import Issues from './pages/Issues';
import Packages from './pages/Packages';

type Page = 'dashboard' | 'repos' | 'issues' | 'packages';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [selectedRepo, setSelectedRepo] = useState<string>('');

  const handleNavigation = (page: Page, org?: string, repo?: string) => {
    setCurrentPage(page);
    if (org) setSelectedOrg(org);
    if (repo) setSelectedRepo(repo);
  };

  return (
    <div className="app">
      <Navigation currentPage={currentPage} onNavigate={handleNavigation} />
      <main className="main-content">
        {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigation} />}
        {currentPage === 'repos' && <RepoStatus org={selectedOrg} onNavigate={handleNavigation} />}
        {currentPage === 'issues' && <Issues repo={selectedRepo} />}
        {currentPage === 'packages' && <Packages />}
      </main>
    </div>
  );
}

