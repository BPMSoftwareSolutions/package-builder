import React, { useState } from 'react';
import './styles/index.css';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import RepoStatus from './pages/RepoStatus';
import Issues from './pages/Issues';
import Packages from './pages/Packages';
import ArchitectureDashboard from './pages/ArchitectureDashboard';
import MetricsDashboard from './pages/MetricsDashboard';
import InsightsPage from './pages/InsightsPage';
import SettingsPage from './pages/SettingsPage';
import ComponentDetails from './pages/ComponentDetails';

type Page = 'dashboard' | 'repos' | 'issues' | 'packages' | 'architecture' | 'metrics' | 'insights' | 'settings' | 'component-details';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedOrg, setSelectedOrg] = useState<string>('BPMSoftwareSolutions');
  const [selectedRepo, setSelectedRepo] = useState<string>('BPMSoftwareSolutions/package-builder');
  const [selectedComponent, setSelectedComponent] = useState<any>(null);

  const handleNavigation = (page: Page, data?: any) => {
    setCurrentPage(page);
    if (data?.org) setSelectedOrg(data.org);
    if (data?.repo) setSelectedRepo(data.repo);
    if (data?.component) setSelectedComponent(data.component);
  };

  return (
    <>
      <Navigation currentPage={currentPage} onNavigate={handleNavigation} />
      <main className="main-content">
        <ErrorBoundary>
          {currentPage === 'dashboard' && <Dashboard onNavigate={handleNavigation} />}
          {currentPage === 'architecture' && <ArchitectureDashboard onNavigate={handleNavigation} />}
          {currentPage === 'metrics' && <MetricsDashboard onNavigate={handleNavigation} />}
          {currentPage === 'insights' && <InsightsPage onNavigate={handleNavigation} />}
          {currentPage === 'component-details' && <ComponentDetails component={selectedComponent} onNavigate={handleNavigation} />}
          {currentPage === 'repos' && <RepoStatus org={selectedOrg} onNavigate={handleNavigation} />}
          {currentPage === 'issues' && <Issues repo={selectedRepo} />}
          {currentPage === 'packages' && <Packages />}
          {currentPage === 'settings' && <SettingsPage onNavigate={handleNavigation} />}
        </ErrorBoundary>
      </main>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <div className="app">
        <AppContent />
      </div>
    </ThemeProvider>
  );
}

