import React, { useState } from 'react';
import { AlertTriangle, TrendingDown, Clock, Users, CheckCircle, AlertCircle, ChevronDown, Filter, RefreshCw } from 'lucide-react';

const BottleneckDashboard = () => {
  const [expandedConstraint, setExpandedConstraint] = useState('reviewer');
  const [timeRange, setTimeRange] = useState('24h');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Bottleneck Detection & Constraint Radar</h1>
            <p className="text-slate-400">Problem #1: Bottlenecks and Long Lead Times</p>
          </div>
          <div className="flex gap-3">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 hover:border-slate-500"
            >
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
            <button 
              onClick={handleRefresh}
              className={`px-4 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 hover:border-slate-500 flex items-center gap-2 transition-transform ${refreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner */}
      <div className="bg-red-900/40 border border-red-600 rounded-lg p-4 mb-8 flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-red-200 mb-1">🚨 Critical Bottleneck Detected</h3>
          <p className="text-red-300 text-sm">Review approval is the #1 constraint. Average wait time: 18.5 hours. This is blocking 34 PRs across 8 repos.</p>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricTile 
          label="Avg Lead Time" 
          value="28.3 hrs" 
          change="+4.2 hrs" 
          status="critical"
          icon={<Clock className="w-5 h-5" />}
        />
        <MetricTile 
          label="PRs Waiting" 
          value="34" 
          change="+8 since yesterday" 
          status="critical"
          icon={<AlertCircle className="w-5 h-5" />}
        />
        <MetricTile 
          label="Top Bottleneck" 
          value="Code Review" 
          change="18.5 hrs avg wait" 
          status="critical"
          icon={<Users className="w-5 h-5" />}
        />
        <MetricTile 
          label="Fastest Stage" 
          value="Build" 
          change="4.2 mins avg" 
          status="healthy"
          icon={<CheckCircle className="w-5 h-5" />}
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Constraint Radar */}
        <div className="lg:col-span-2">
          <ConstraintRadar />
        </div>

        {/* Flow Stage Breakdown */}
        <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
          <h2 className="text-lg font-bold text-white mb-4">Pipeline Stage Times</h2>
          <div className="space-y-3">
            <StageBar label="Build & Compile" time="4.2 min" percentage={15} status="healthy" />
            <StageBar label="Unit Tests" time="6.8 min" percentage={24} status="healthy" />
            <StageBar label="E2E Tests" time="12.3 min" percentage={43} status="warning" />
            <StageBar label="Code Review" time="18.5 hrs" percentage={65} status="critical" />
            <StageBar label="Approval Gate" time="8.2 hrs" percentage={29} status="critical" />
            <StageBar label="Deployment" time="2.1 min" percentage={7} status="healthy" />
          </div>
          <div className="mt-6 pt-4 border-t border-slate-600">
            <p className="text-sm text-slate-400 mb-3">Total Cycle Time: 28.3 hours</p>
            <div className="bg-red-900/20 text-red-300 text-xs p-2 rounded border border-red-600/30">
              ⚠️ 94% of time is in review + approval stages
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Constraint Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ConstraintDetail 
          title="Code Review Bottleneck"
          status="critical"
          expanded={expandedConstraint === 'reviewer'}
          onToggle={() => setExpandedConstraint(expandedConstraint === 'reviewer' ? null : 'reviewer')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Overloaded Reviewers</h4>
              <div className="space-y-2">
                <ReviewerLoad name="Alice Chen" load={12} capacity={4} />
                <ReviewerLoad name="Bob Rodriguez" load={10} capacity={4} />
                <ReviewerLoad name="Carol Martinez" load={3} capacity={4} />
              </div>
            </div>
            <div className="pt-3 border-t border-slate-600">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Impact</h4>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• 34 PRs blocked waiting for review</li>
                <li>• Average wait: 18.5 hours</li>
                <li>• 8 repos affected</li>
              </ul>
            </div>
            <div className="pt-3 border-t border-slate-600">
              <h4 className="text-sm font-semibold text-emerald-400 mb-2">✅ Recommended Actions</h4>
              <ul className="text-xs text-emerald-300 space-y-1">
                <li>• Distribute reviews to Carol (3/4 capacity)</li>
                <li>• Enable auto-approval for minor changes</li>
                <li>• Enforce review limit of 8 per reviewer</li>
              </ul>
            </div>
          </div>
        </ConstraintDetail>

        <ConstraintDetail 
          title="Sequential Build/Test Pipeline"
          status="warning"
          expanded={expandedConstraint === 'pipeline'}
          onToggle={() => setExpandedConstraint(expandedConstraint === 'pipeline' ? null : 'pipeline')}
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Current Flow (Sequential)</h4>
              <div className="space-y-2 font-mono text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-16">Build</div>
                  <div className="flex-1 h-1 bg-blue-600 rounded"></div>
                  <div className="w-12">4.2m</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16">↓ Unit Tests</div>
                  <div className="flex-1 h-1 bg-blue-600 rounded"></div>
                  <div className="w-12">6.8m</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16">↓ E2E Tests</div>
                  <div className="flex-1 h-1 bg-yellow-600 rounded"></div>
                  <div className="w-12">12.3m</div>
                </div>
                <div className="text-right text-yellow-400">Total: 23.3 minutes</div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-600">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Potential (Parallelized)</h4>
              <div className="space-y-2 font-mono text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-16">Build</div>
                  <div className="flex-1 h-1 bg-emerald-600 rounded"></div>
                  <div className="w-12">4.2m</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16">Unit + E2E</div>
                  <div className="flex-1 h-1 bg-emerald-600 rounded"></div>
                  <div className="w-12">12.3m</div>
                </div>
                <div className="text-right text-emerald-400">Total: 16.5 minutes (-47% faster!)</div>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-600">
              <h4 className="text-sm font-semibold text-emerald-400 mb-2">✅ Recommended Actions</h4>
              <ul className="text-xs text-emerald-300 space-y-1">
                <li>• Parallelize unit and E2E tests</li>
                <li>• Use matrix builds for plugins</li>
                <li>• Cache dependencies to speed build</li>
              </ul>
            </div>
          </div>
        </ConstraintDetail>
      </div>

      {/* Repo-Level Details */}
      <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Most Affected Repositories
        </h2>
        <div className="space-y-3">
          <RepoBottleneckRow 
            repo="plugin-validator" 
            prsWaiting={12} 
            avgWait="22.3 hrs"
            bottleneck="Review"
            trend="↑ Worsening"
          />
          <RepoBottleneckRow 
            repo="conductor-core" 
            prsWaiting={8} 
            avgWait="19.1 hrs"
            bottleneck="Review + E2E Tests"
            trend="→ Stable"
          />
          <RepoBottleneckRow 
            repo="valence-rules" 
            prsWaiting={7} 
            avgWait="15.8 hrs"
            bottleneck="Approval"
            trend="↓ Improving"
          />
          <RepoBottleneckRow 
            repo="thin-host" 
            prsWaiting={4} 
            avgWait="28.5 hrs"
            bottleneck="All stages sequential"
            trend="↑ Worsening"
          />
          <RepoBottleneckRow 
            repo="renderx-cli" 
            prsWaiting={3} 
            avgWait="12.4 hrs"
            bottleneck="Build"
            trend="↓ Improving"
          />
        </div>
      </div>

      {/* Action Items */}
      <div className="mt-8 bg-emerald-900/20 border border-emerald-600/30 rounded-lg p-6">
        <h2 className="text-lg font-bold text-emerald-300 mb-4">🎯 Action Plan to Improve Flow</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ActionItem priority="high" title="Distribute Code Review Load" description="Add Carol to review rotation. Implement WIP limit of 8 PRs/reviewer." time="Immediate" />
          <ActionItem priority="high" title="Parallelize CI Pipeline" description="Move E2E tests to run parallel with unit tests using matrix builds." time="1-2 weeks" />
          <ActionItem priority="medium" title="Auto-Approve Minor Changes" description="Enable auto-merge for dependency updates and docs-only changes." time="1 week" />
          <ActionItem priority="medium" title="Cache & Optimize Build" description="Implement Docker layer caching and dependency caching in CI." time="2-3 weeks" />
        </div>
      </div>
    </div>
  );
};

const MetricTile = ({ label, value, change, status, icon }) => {
  const statusColor = status === 'critical' ? 'text-red-400 border-red-600/50' : 'text-emerald-400 border-emerald-600/50';
  
  return (
    <div className={`bg-slate-700/50 border ${statusColor} border-opacity-50 rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <div className={status === 'critical' ? 'text-red-400' : 'text-emerald-400'}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold mb-1 ${status === 'critical' ? 'text-red-300' : 'text-emerald-300'}`}>{value}</p>
      <p className={`text-xs ${status === 'critical' ? 'text-red-400' : 'text-emerald-400'}`}>{change}</p>
    </div>
  );
};

const StageBar = ({ label, time, percentage, status }) => {
  const colors = {
    healthy: 'bg-emerald-600',
    warning: 'bg-yellow-600',
    critical: 'bg-red-600'
  };

  const textColors = {
    healthy: 'text-emerald-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400'
  };

  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-slate-300">{label}</span>
        <span className={`text-sm font-mono ${textColors[status]}`}>{time}</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${colors[status]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const ReviewerLoad = ({ name, load, capacity }) => {
  const isOverloaded = load > capacity;
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className={`text-sm ${isOverloaded ? 'text-red-300' : 'text-slate-300'}`}>{name}</span>
        <span className={`text-xs font-mono ${isOverloaded ? 'text-red-400' : 'text-emerald-400'}`}>{load}/{capacity}</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${isOverloaded ? 'bg-red-600' : 'bg-emerald-600'}`}
          style={{ width: `${(load / capacity) * 100}%` }}
        />
      </div>
    </div>
  );
};

const ConstraintDetail = ({ title, status, expanded, onToggle, children }) => {
  const bgColor = status === 'critical' ? 'bg-red-900/20 border-red-600/30' : 'bg-yellow-900/20 border-yellow-600/30';
  const textColor = status === 'critical' ? 'text-red-300' : 'text-yellow-300';

  return (
    <div className={`${bgColor} border rounded-lg overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-black/20 transition-colors"
      >
        <h3 className={`font-semibold ${textColor}`}>{title}</h3>
        <ChevronDown className={`w-5 h-5 ${textColor} transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-current/20">
          {children}
        </div>
      )}
    </div>
  );
};

const RepoBottleneckRow = ({ repo, prsWaiting, avgWait, bottleneck, trend }) => {
  const trendColor = trend.includes('Worsening') ? 'text-red-400' : trend.includes('Improving') ? 'text-emerald-400' : 'text-yellow-400';

  return (
    <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded border border-slate-600/30">
      <div className="flex-1">
        <p className="font-semibold text-white text-sm">{repo}</p>
        <p className="text-xs text-slate-400 mt-1">{bottleneck}</p>
      </div>
      <div className="flex items-center gap-6 text-right">
        <div>
          <p className="text-red-400 font-mono font-semibold">{prsWaiting}</p>
          <p className="text-xs text-slate-400">PRs waiting</p>
        </div>
        <div>
          <p className="text-yellow-400 font-mono font-semibold">{avgWait}</p>
          <p className="text-xs text-slate-400">avg wait</p>
        </div>
        <div className={`text-sm font-semibold ${trendColor}`}>{trend}</div>
      </div>
    </div>
  );
};

const ActionItem = ({ priority, title, description, time }) => {
  const priorityColor = priority === 'high' ? 'bg-red-900/30 border-red-600/50 text-red-300' : 'bg-yellow-900/30 border-yellow-600/50 text-yellow-300';
  
  return (
    <div className={`${priorityColor} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className={`px-2 py-1 rounded text-xs font-bold ${priority === 'high' ? 'bg-red-600' : 'bg-yellow-600'}`}>
          {priority.toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs mt-1 opacity-90">{description}</p>
          <p className="text-xs mt-2 opacity-70">{time}</p>
        </div>
      </div>
    </div>
  );
};

const ConstraintRadar = () => {
  return (
    <div className="bg-slate-700/50 rounded-lg border border-slate-600 p-6">
      <h2 className="text-lg font-bold text-white mb-6">Constraint Radar (Bottleneck Heat Map)</h2>
      
      <div className="space-y-6">
        {/* Constraint Rings */}
        <div className="relative w-full h-64 mx-auto">
          <svg viewBox="0 0 300 300" className="w-full h-full">
            {/* Background rings */}
            <circle cx="150" cy="150" r="120" fill="none" stroke="#334155" strokeWidth="1" opacity="0.3" />
            <circle cx="150" cy="150" r="85" fill="none" stroke="#334155" strokeWidth="1" opacity="0.3" />
            <circle cx="150" cy="150" r="50" fill="none" stroke="#334155" strokeWidth="1" opacity="0.3" />
            
            {/* Axes */}
            <line x1="150" y1="30" x2="150" y2="270" stroke="#334155" strokeWidth="1" opacity="0.3" />
            <line x1="30" y1="150" x2="270" y2="150" stroke="#334155" strokeWidth="1" opacity="0.3" />
            
            {/* Constraint bubbles */}
            <circle cx="210" cy="100" r="35" fill="#dc2626" opacity="0.6" className="hover:opacity-80 transition-opacity cursor-pointer" />
            <text x="210" y="105" textAnchor="middle" className="text-xs fill-white font-semibold pointer-events-none">Review</text>
            
            <circle cx="120" cy="80" r="28" fill="#ea580c" opacity="0.6" className="hover:opacity-80 transition-opacity cursor-pointer" />
            <text x="120" y="85" textAnchor="middle" className="text-xs fill-white font-semibold pointer-events-none">E2E Tests</text>
            
            <circle cx="230" cy="150" r="22" fill="#eab308" opacity="0.6" className="hover:opacity-80 transition-opacity cursor-pointer" />
            <text x="230" y="155" textAnchor="middle" className="text-xs fill-white font-semibold pointer-events-none">Approval</text>
            
            <circle cx="100" cy="180" r="15" fill="#22c55e" opacity="0.6" className="hover:opacity-80 transition-opacity cursor-pointer" />
            <text x="100" y="185" textAnchor="middle" className="text-xs fill-white font-semibold pointer-events-none">Build</text>
            
            <circle cx="75" cy="120" r="12" fill="#22c55e" opacity="0.6" className="hover:opacity-80 transition-opacity cursor-pointer" />
            <text x="75" y="125" textAnchor="middle" className="text-xs fill-white font-semibold pointer-events-none">Deploy</text>
          </svg>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-slate-300">Critical (18+ hrs)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-600"></div>
            <span className="text-slate-300">High (8-18 hrs)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-600"></div>
            <span className="text-slate-300">Medium (2-8 hrs)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-600"></div>
            <span className="text-slate-300">Healthy (&lt;2 hrs)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottleneckDashboard;