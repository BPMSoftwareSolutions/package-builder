import React from 'react';
import { Activity, Zap, AlertCircle, Clock, Route, MessageSquare, Package, CheckCircle } from 'lucide-react';

const EnhancedStatsSection = () => {
  const loadingProgress = (3 / 8) * 100; // 3 loaded out of 8 total
  const successRate = 100; // No failures
  const loadTimeProgress = Math.min((1247 / 3000) * 100, 100); // Relative to 3s max

  // Animated counter effect
  const AnimatedNumber = ({ value, suffix = '' }) => (
    <span className="font-bold text-2xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
      {value}{suffix}
    </span>
  );

  // Progress ring component
  const ProgressRing = ({ percentage, color = "blue" }) => {
    const radius = 40;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    const gradientId = `gradient-${color}`;
    
    return (
      <div className="relative w-24 h-24">
        <svg className="transform -rotate-90 w-24 h-24">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : '#f59e0b'} />
              <stop offset="100%" stopColor={color === 'blue' ? '#8b5cf6' : color === 'green' ? '#34d399' : '#fbbf24'} />
            </linearGradient>
          </defs>
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="rgba(75, 85, 99, 0.2)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-white">{Math.round(percentage)}%</span>
        </div>
      </div>
    );
  };

  // Mini sparkline component
  const Sparkline = ({ data, color = "blue" }) => {
    const max = Math.max(...data);
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 60;
      const y = 20 - (value / max) * 15;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="60" height="20" className="ml-2">
        <polyline
          fill="none"
          stroke={color === 'blue' ? '#3b82f6' : color === 'green' ? '#10b981' : '#f59e0b'}
          strokeWidth="1.5"
          points={points}
          className="opacity-80"
        />
      </svg>
    );
  };

  const performanceData = [5, 12, 8, 15, 10, 18, 14, 20];

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -mr-32 -mt-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-500/5 to-cyan-500/5 rounded-full -ml-24 -mb-24"></div>
      
      <div className="relative">
        <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-400" />
          Plugin Statistics Dashboard
        </h2>

        {/* Top Row - Key Metrics with Visuals */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Loading Progress Ring */}
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur border border-gray-600/50 rounded-lg p-6 text-center">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Loading Progress</h3>
            <div className="flex justify-center mb-3">
              <ProgressRing percentage={loadingProgress} color="blue" />
            </div>
            <div className="text-lg font-semibold text-white">
              3 / 8 Plugins
            </div>
            <div className="text-xs text-gray-400 mt-1">Successfully Loaded</div>
          </div>

          {/* Success Rate */}
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur border border-gray-600/50 rounded-lg p-6 text-center">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Success Rate</h3>
            <div className="flex justify-center mb-3">
              <ProgressRing percentage={successRate} color="green" />
            </div>
            <div className="text-lg font-semibold text-white">
              100%
            </div>
            <div className="text-xs text-green-400 mt-1">No Failures</div>
          </div>

          {/* Load Time Performance */}
          <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur border border-gray-600/50 rounded-lg p-6 text-center">
            <h3 className="text-sm font-medium text-gray-300 mb-4">Load Performance</h3>
            <div className="flex justify-center mb-3">
              <ProgressRing percentage={loadTimeProgress} color="orange" />
            </div>
            <div className="text-lg font-semibold text-white">
              1.247s
            </div>
            <div className="text-xs text-orange-400 mt-1">Total Load Time</div>
          </div>
        </div>

        {/* Bottom Row - Detailed Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Total Plugins */}
          <div className="group bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur border border-gray-600/50 rounded-lg p-4 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
              <Sparkline data={[8, 8, 8, 8, 8, 8, 8, 8]} color="blue" />
            </div>
            <div className="text-center">
              <AnimatedNumber value={8} />
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Total Plugins</div>
            </div>
          </div>

          {/* Loaded */}
          <div className="group bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur border border-gray-600/50 rounded-lg p-4 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
              <Sparkline data={[0, 1, 2, 2, 3, 3, 3, 3]} color="green" />
            </div>
            <div className="text-center">
              <AnimatedNumber value={3} />
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Loaded</div>
            </div>
          </div>

          {/* Failed */}
          <div className="group bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur border border-gray-600/50 rounded-lg p-4 hover:border-red-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/10">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
              <Sparkline data={[0, 0, 0, 0, 0, 0, 0, 0]} color="red" />
            </div>
            <div className="text-center">
              <AnimatedNumber value={0} />
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Failed</div>
            </div>
          </div>

          {/* Routes */}
          <div className="group bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur border border-gray-600/50 rounded-lg p-4 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <div className="flex items-center justify-between mb-2">
              <Route className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              <Sparkline data={[2, 3, 4, 4, 5, 5, 5, 5]} color="purple" />
            </div>
            <div className="text-center">
              <AnimatedNumber value={5} />
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Routes</div>
            </div>
          </div>

          {/* Topics */}
          <div className="group bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur border border-gray-600/50 rounded-lg p-4 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
            <div className="flex items-center justify-between mb-2">
              <MessageSquare className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <Sparkline data={[1, 2, 3, 3, 3, 3, 3, 3]} color="cyan" />
            </div>
            <div className="text-center">
              <AnimatedNumber value={3} />
              <div className="text-xs text-gray-400 uppercase tracking-wide mt-1">Topics</div>
            </div>
          </div>
        </div>

        {/* Performance Bar at Bottom */}
        <div className="mt-6 pt-4 border-t border-gray-700/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              System Performance
            </span>
            <span className="text-green-400 font-medium">Excellent</span>
          </div>
          <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: '87%' }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>CPU: 12%</span>
            <span>Memory: 64MB</span>
            <span>Network: 2.1KB/s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedStatsSection;