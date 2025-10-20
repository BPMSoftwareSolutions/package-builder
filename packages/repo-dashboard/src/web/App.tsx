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
import DashboardSettings from './pages/DashboardSettings';
import ComponentDetails from './pages/ComponentDetails';
import FlowDashboard from './pages/FlowDashboard';
import LearningDashboard from './pages/LearningDashboard';
import CollaborationDashboard from './pages/CollaborationDashboard';
import ConductorLogsMonitoringDashboard from './pages/ConductorLogsMonitoringDashboard';
import BottleneckDetectionDashboard from './pages/BottleneckDetectionDashboard';

type Page = 'dashboard' | 'repos' | 'issues' | 'packages' | 'architecture' | 'metrics' | 'insights' | 'settings' | 'dashboard-settings' | 'component-details' | 'flow' | 'learning' | 'collaboration' | 'conductor-logs' | 'bottleneck';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedOrg, setSelectedOrg] = useState<string>('BPMSoftwareSolutions');
  const [selectedRepo, setSelectedRepo] = useState<string>('BPMSoftwareSolutions/package-builder');
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [selectedArchOrg, setSelectedArchOrg] = useState<string>('BPMSoftwareSolutions');
  const [selectedArchRepo, setSelectedArchRepo] = useState<string | null>(null);
  const [isArchitectureMode, setIsArchitectureMode] = useState<boolean>(false);

  const handleNavigation = (page: Page, data?: any) => {
    setCurrentPage(page);
    if (data?.org) setSelectedOrg(data.org);
    if (data?.repo) setSelectedRepo(data.repo);
    if (data?.component) setSelectedComponent(data.component);
    if (data?.archOrg) setSelectedArchOrg(data.archOrg);
    if (data?.archRepo !== undefined) setSelectedArchRepo(data.archRepo);
    if (data?.isArchitectureMode !== undefined) setIsArchitectureMode(data.isArchitectureMode);
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
          {currentPage === 'flow' && <FlowDashboard onNavigate={handleNavigation} />}
          {currentPage === 'learning' && <LearningDashboard />}
          {currentPage === 'collaboration' && <CollaborationDashboard />}
          {currentPage === 'conductor-logs' && <ConductorLogsMonitoringDashboard onNavigate={handleNavigation} />}
          {currentPage === 'bottleneck' && <BottleneckDetectionDashboard />}
          {currentPage === 'component-details' && <ComponentDetails component={selectedComponent} onNavigate={handleNavigation} />}
          {currentPage === 'repos' && <RepoStatus org={selectedOrg} repo={selectedArchRepo || undefined} isArchitectureMode={isArchitectureMode} onNavigate={handleNavigation} />}
          {currentPage === 'issues' && <Issues repo={selectedRepo} />}
          {currentPage === 'packages' && <Packages />}
          {currentPage === 'settings' && <SettingsPage onNavigate={handleNavigation} />}
          {currentPage === 'dashboard-settings' && <DashboardSettings onNavigate={handleNavigation} />}
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

