import React from 'react';
import HomeDashboard from './HomeDashboard';

interface DashboardProps {
  onNavigate: (page: string, data?: any) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  return <HomeDashboard onNavigate={onNavigate} />;
}

