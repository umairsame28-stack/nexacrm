'use client';

import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, TrendingUp, Clock, Search, Bell, ChevronDown 
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Realistic revenue data for the chart
const revenueData = [
  { month: 'Apr', revenue: 68400, forecast: 72000 },
  { month: 'May', revenue: 72800, forecast: 78000 },
  { month: 'Jun', revenue: 85200, forecast: 82000 },
  { month: 'Jul', revenue: 91600, forecast: 88000 },
  { month: 'Aug', revenue: 104200, forecast: 98000 },
  { month: 'Sep', revenue: 118800, forecast: 112000 },
  { month: 'Oct', revenue: 125400, forecast: 125000 },
];

export function InteractiveDashboard() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative group">
      <div className="relative rounded-xl bg-white/98 backdrop-blur-xl shadow-2xl border border-slate-200/50 overflow-hidden transform transition-transform duration-700 hover:scale-[1.02] max-w-full">
        {/* Authentic NexaCRM Application Header - NO BROWSER CHROME */}
        <div className="h-12 sm:h-14 bg-white border-b border-slate-200/80 flex items-center px-2 sm:px-4 gap-2 sm:gap-4">
          {/* Logo + Brand */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs sm:text-sm">N</span>
            </div>
            <span className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">NexaCRM</span>
          </div>

          {/* Current View */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-50 rounded-lg">
            <LayoutDashboard className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
            <span className="text-[10px] sm:text-xs font-semibold text-slate-700">Dashboard</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Search - Hidden on small mobile */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg w-32 lg:w-48">
            <Search className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Search...</span>
          </div>

          {/* Notifications */}
          <button className="relative p-1.5 sm:p-2 hover:bg-slate-50 rounded-lg transition-colors">
            <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-600" />
            <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 h-1.5 w-1.5 rounded-full bg-destructive" />
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-2 py-1 sm:py-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
            <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-[10px] sm:text-xs font-semibold">
              JD
            </div>
            <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-slate-400 hidden sm:block" />
          </div>
        </div>

        {/* Dashboard Content - No Sidebar, Floating Clean */}
        <div className="bg-gradient-to-br from-slate-50/50 via-white to-slate-50/30 p-3 sm:p-6">
          {/* Dashboard Header with Title */}
          <div className="flex items-center justify-between mb-3 sm:mb-5">
            <div>
              <h2 className="text-sm sm:text-lg font-bold text-slate-900">Overview</h2>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Last 30 days performance</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs">
              <div className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-success" />
              </div>
              <span className="text-slate-500 font-medium">Live</span>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-5">
            {/* Compact KPI Overview Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {[
                { label: 'Revenue', value: '$125.4K', change: '+12.8%', trend: 'up' },
                { label: 'Qualified Leads', value: '2,543', change: '+8.4%', trend: 'up' },
                { label: 'Pipeline', value: '$1.24M', change: '+14.2%', trend: 'up' },
                { label: 'Win Rate', value: '34.8%', change: '+4.1%', trend: 'up' },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg p-2 sm:p-3.5 border border-slate-200/60 shadow-sm"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                    transition: `all 0.4s ease-out ${i * 0.06}s`,
                  }}
                >
                  <div className="text-[9px] sm:text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-1 sm:mb-1.5">
                    {stat.label}
                  </div>
                  <div className="text-base sm:text-2xl font-bold text-slate-900 mb-0.5 sm:mb-1">{stat.value}</div>
                  <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-semibold text-success">
                    <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Revenue Chart */}
            <div className="bg-white rounded-lg p-3 sm:p-5 border border-slate-200/60 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2">
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-900">Revenue Performance</div>
                  <div className="text-[10px] sm:text-xs text-slate-500 mt-0.5">Actual vs Forecast</div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs">
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary" />
                    <span className="text-slate-600">Actual</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-1.5">
                    <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-slate-300" />
                    <span className="text-slate-600">Forecast</span>
                  </div>
                </div>
              </div>

              {/* Recharts Area Chart */}
              <div className="h-32 sm:h-48 -ml-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="rgb(99, 102, 241)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="rgb(99, 102, 241)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '11px', padding: '6px 10px' }}
                      labelStyle={{ color: '#cbd5e1', fontWeight: 600 }}
                      itemStyle={{ color: '#f1f5f9' }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    />
                    <Area type="monotone" dataKey="forecast" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 4" fill="none" isAnimationActive={isVisible} animationDuration={1200} />
                    <Area type="monotone" dataKey="revenue" stroke="rgb(99, 102, 241)" strokeWidth={2} fill="url(#revenueGradient)" isAnimationActive={isVisible} animationDuration={1200} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Chart Summary */}
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] sm:text-xs">
                <div className="flex items-center gap-2 sm:gap-4">
                  <div>
                    <span className="text-slate-500">Current:</span>
                    <span className="ml-1 sm:ml-1.5 font-semibold text-slate-900">$125.4K</span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-slate-500">Target:</span>
                    <span className="ml-1.5 font-semibold text-slate-900">$125K</span>
                  </div>
                  <div className="flex items-center gap-0.5 sm:gap-1 text-success font-semibold">
                    <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span>+48.3%</span>
                  </div>
                </div>
                <div className="text-slate-400">Oct 2024</div>
              </div>
            </div>

            {/* Pipeline + Activity Side by Side - Stack on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Pipeline Stages */}
              <div className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200/60 shadow-sm">
                <div className="text-xs font-semibold text-slate-900 mb-2 sm:mb-3">Pipeline</div>
                <div className="space-y-2 sm:space-y-2.5">
                  {[
                    { stage: 'Qualified', count: 84, color: 'bg-blue-500' },
                    { stage: 'Proposal', count: 42, color: 'bg-primary' },
                    { stage: 'Negotiation', count: 27, color: 'bg-amber-500' },
                    { stage: 'Won', count: 18, color: 'bg-success' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-2.5" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateX(0)' : 'translateX(-8px)', transition: `all 0.3s ease-out ${0.5 + i * 0.08}s` }}>
                      <div className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full ${item.color}`} />
                      <div className="flex-1 flex items-center justify-between">
                        <span className="text-[11px] sm:text-xs text-slate-600">{item.stage}</span>
                        <span className="text-sm sm:text-base font-bold text-slate-900">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg p-3 sm:p-4 border border-slate-200/60 shadow-sm">
                <div className="text-xs font-semibold text-slate-900 mb-2 sm:mb-3">Recent Activity</div>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    { name: 'Sarah Chen', action: 'Closed deal', detail: '$42,000', time: '2m', avatar: 'SC', color: 'from-primary to-accent' },
                    { name: 'Mike Ross', action: 'Qualified lead', detail: 'Enterprise', time: '5m', avatar: 'MR', color: 'from-accent to-primary' },
                    { name: 'Emma Wilson', action: 'Sent proposal', detail: 'DataFlow', time: '12m', avatar: 'EW', color: 'from-primary to-info' },
                  ].map((activity, i) => (
                    <div key={i} className="flex items-center gap-2 sm:gap-3" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateX(0)' : 'translateX(-8px)', transition: `all 0.3s ease-out ${0.5 + i * 0.08}s` }}>
                      <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br ${activity.color} flex items-center justify-center text-white text-[10px] sm:text-xs font-bold flex-shrink-0`}>
                        {activity.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1 sm:gap-1.5">
                          <span className="text-[11px] sm:text-xs font-semibold text-slate-900 truncate">{activity.name}</span>
                          <span className="text-[10px] sm:text-xs text-slate-500">{activity.action}</span>
                        </div>
                        <div className="text-[10px] sm:text-xs text-slate-600">{activity.detail}</div>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-slate-400 flex-shrink-0">
                        <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                        {activity.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Glow Effects for Dark Background */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
      <div className="absolute -inset-8 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl blur-3xl opacity-50 -z-20" />
    </div>
  );
}
