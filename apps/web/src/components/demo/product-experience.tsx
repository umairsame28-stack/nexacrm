'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Search, Filter, MoreVertical, ChevronRight, Phone, Mail, 
         MessageSquare, Send, Check, Clock, TrendingUp, DollarSign,
         Users, Target, Calendar, Bell, Settings, Zap } from 'lucide-react';

interface ProductExperienceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProductExperience({ isOpen, onClose }: ProductExperienceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const progress = scrollTop / (scrollHeight - clientHeight);
      setScrollProgress(progress);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const section = Math.floor(scrollProgress * 9);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 sm:top-8 sm:right-8 z-50 p-2 sm:p-3 rounded-xl bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 text-white transition-all duration-300 hover:scale-110 group"
        aria-label="Close"
      >
        <X className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Progress Indicator - Right Side on Desktop, Bottom on Mobile */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden sm:flex flex-col gap-3">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className={`transition-all duration-300 rounded-full ${
              section === i
                ? 'w-2 h-8 bg-white'
                : section > i
                ? 'w-2 h-2 bg-white/50'
                : 'w-2 h-2 bg-white/20'
            }`}
            title={
              i === 0 ? 'Dashboard' :
              i === 1 ? 'Leads' :
              i === 2 ? 'Pipeline' :
              i === 3 ? 'Inbox' :
              i === 4 ? 'Analytics' :
              i === 5 ? 'Automation' :
              i === 6 ? 'Team' :
              i === 7 ? 'Settings' :
              'Get Started'
            }
          />
        ))}
      </div>

      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>

        {/* Spacer for smooth scroll */}
        <div className="h-[900vh]">
          {/* Pinned Dashboard - Stays Fixed with Camera Transforms */}
          <div className="sticky top-0 h-screen flex items-center justify-center perspective-1000">
            <div 
              className="w-[90vw] max-w-7xl transition-all duration-700 ease-out"
              style={{
                transform: `
                  scale(${1 - scrollProgress * 0.05})
                  rotateY(${scrollProgress * 2}deg)
                  rotateX(${scrollProgress * -1}deg)
                  translateZ(${scrollProgress * -100}px)
                `,
                transformStyle: 'preserve-3d',
              }}
            >
              <DashboardFrame section={section} scrollProgress={scrollProgress} />
            </div>
          </div>

          {/* Scroll Indicator - Only show on first section */}
          {section === 0 && scrollProgress < 0.05 && (
            <div className="fixed bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none animate-bounce">
              {/* Animated Mouse Icon */}
              <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
                <div className="w-1.5 h-3 bg-white/50 rounded-full animate-scroll-down" />
              </div>
              {/* Text hint */}
              <div className="text-white/50 text-sm font-medium">Scroll to explore</div>
            </div>
          )}

          {/* Section Label - Bottom Center */}
          <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 text-center pointer-events-none px-4 max-w-full">
            <div className="inline-flex items-center gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 transition-all duration-300">
              <span className="text-white font-medium text-xs sm:text-sm truncate max-w-[280px] sm:max-w-none">
                {section === 0 && "Dashboard Overview"}
                {section === 1 && "Lead Management"}
                {section === 2 && "Sales Pipeline"}
                {section === 3 && "WhatsApp Inbox"}
                {section === 4 && "Analytics & Reports"}
                {section === 5 && "Automation Builder"}
                {section === 6 && "Team Collaboration"}
                {section === 7 && "Settings & Integrations"}
                {section >= 8 && "Ready to Transform Your Business?"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dashboard Frame Component
function DashboardFrame({ section, scrollProgress }: { section: number; scrollProgress: number }) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10">
      {/* Browser Chrome */}
      <div className="bg-slate-900/90 backdrop-blur-xl border-b border-white/10 px-2 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3">
        <div className="flex gap-1.5 sm:gap-2">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors cursor-pointer" />
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors cursor-pointer" />
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors cursor-pointer" />
        </div>
        <div className="flex-1 flex items-center gap-2 bg-slate-800/50 rounded-lg px-2 sm:px-4 py-1 sm:py-1.5">
          <div className="w-2 h-2 sm:w-3 sm:h-3 text-white/40 text-xs sm:text-base">🔒</div>
          <span className="text-[10px] sm:text-sm text-white/60 truncate">app.nexacrm.com/dashboard</span>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden" style={{ height: '75vh' }}>
        {/* Sidebar - Hidden on Mobile */}
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-64 bg-slate-900/50 backdrop-blur-xl border-r border-white/10 p-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              N
            </div>
            <span className="text-white font-semibold text-lg">NexaCRM</span>
          </div>
          
          <nav className="space-y-1">
            {[
              { icon: Target, label: 'Dashboard', active: section === 0 },
              { icon: Users, label: 'Leads', active: section === 1 },
              { icon: TrendingUp, label: 'Pipeline', active: section === 2 },
              { icon: MessageSquare, label: 'Inbox', active: section === 3 },
              { icon: DollarSign, label: 'Analytics', active: section === 4 },
              { icon: Zap, label: 'Automation', active: section === 5 },
              { icon: Users, label: 'Team', active: section === 6 },
              { icon: Settings, label: 'Settings', active: section === 7 },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-300 cursor-pointer ${
                  item.active
                    ? 'bg-indigo-500/20 text-white border border-indigo-500/30'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </nav>
        </div>

        {/* Main Content Area - Changes Based on Section */}
        <div className="p-3 sm:p-6 lg:ml-64 h-full overflow-hidden">
          {section === 0 && <DashboardOverview />}
          {section === 1 && <LeadManagement />}
          {section === 2 && <SalesPipeline />}
          {section === 3 && <WhatsAppInbox />}
          {section === 4 && <AnalyticsDashboard />}
          {section === 5 && <AutomationBuilder />}
          {section === 6 && <TeamCollaboration />}
          {section === 7 && <SettingsPanel />}
          {section >= 8 && <FinalHero />}
        </div>
      </div>
    </div>
  );
}

// Section 1: Dashboard Overview
function DashboardOverview() {
  const [revenue, setRevenue] = useState(0);
  const [leads, setLeads] = useState(0);

  useEffect(() => {
    const timer1 = setInterval(() => setRevenue(prev => prev < 584 ? prev + 8 : 584), 30);
    const timer2 = setInterval(() => setLeads(prev => prev < 2847 ? prev + 40 : 2847), 20);
    return () => {
      clearInterval(timer1);
      clearInterval(timer2);
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Grid - 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {[
          { label: 'Total Revenue', value: `$${revenue}K`, icon: DollarSign, color: 'emerald', trend: '+12%' },
          { label: 'Active Leads', value: leads.toLocaleString(), icon: Users, color: 'blue', trend: '+8%' },
          { label: 'Deals Won', value: '142', icon: Target, color: 'purple', trend: '+24%' },
          { label: 'Win Rate', value: '68%', icon: TrendingUp, color: 'orange', trend: '+5%' },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white/5 backdrop-blur-xl rounded-xl p-2 sm:p-4 border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 cursor-pointer group"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-1 sm:mb-2">
              <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 text-${stat.color}-400`} />
              <span className={`text-[10px] sm:text-xs text-${stat.color}-400 bg-${stat.color}-400/10 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full`}>
                {stat.trend}
              </span>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">{stat.value}</div>
            <div className="text-[10px] sm:text-xs text-white/60">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Charts Row - Stack on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Revenue Chart */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 sm:p-6 border border-white/10">
          <h3 className="text-xs sm:text-sm font-medium text-white/80 mb-3 sm:mb-4">Revenue Growth</h3>
          <div className="flex items-end justify-between h-24 sm:h-32 gap-1 sm:gap-2">
            {[45, 52, 48, 65, 58, 72, 68, 82].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end group">
                <div
                  className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t transition-all duration-700 hover:from-indigo-400 hover:to-purple-400"
                  style={{ 
                    height: `${height}%`,
                    animationDelay: `${i * 100}ms`
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white/5 backdrop-blur-xl rounded-xl p-3 sm:p-6 border border-white/10">
          <h3 className="text-xs sm:text-sm font-medium text-white/80 mb-3 sm:mb-4">Recent Activity</h3>
          <div className="space-y-2 sm:space-y-3">
            {[
              { name: 'Sarah Johnson', action: 'closed deal', value: '$45K', time: '2m ago', avatar: '👩' },
              { name: 'Mike Chen', action: 'sent proposal', value: '$32K', time: '5m ago', avatar: '👨' },
              { name: 'Emma Williams', action: 'scheduled call', value: '', time: '12m ago', avatar: '👩‍💼' },
            ].map((activity, i) => (
              <div
                key={i}
                className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-white/5 transition-all duration-200 cursor-pointer"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs sm:text-sm flex-shrink-0">
                  {activity.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm text-white/90 truncate">
                    <span className="font-medium">{activity.name}</span> {activity.action}
                  </div>
                  <div className="text-[10px] sm:text-xs text-white/50">{activity.time}</div>
                </div>
                {activity.value && (
                  <div className="text-xs sm:text-sm font-semibold text-emerald-400 flex-shrink-0">{activity.value}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Section 2: Lead Management
function LeadManagement() {
  const [selectedLead, setSelectedLead] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setSelectedLead(0), 800);
    return () => clearTimeout(timer);
  }, []);

  const leads = [
    { name: 'Sarah Johnson', company: 'Tech Innovators Inc', status: 'Hot', value: '$45,000', score: 95 },
    { name: 'Michael Chen', company: 'Growth Labs', status: 'Warm', value: '$32,000', score: 78 },
    { name: 'Emma Williams', company: 'Digital Solutions', status: 'Hot', value: '$28,000', score: 88 },
    { name: 'James Anderson', company: 'Future Corp', status: 'Cold', value: '$18,000', score: 45 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 h-full">
      {/* Lead Table */}
      <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-semibold text-white">Leads</h3>
          <div className="flex items-center gap-2">
            <button className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Search className="h-3 w-3 sm:h-4 sm:w-4 text-white/60" />
            </button>
            <button className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4 text-white/60" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {leads.map((lead, i) => (
            <div
              key={i}
              onClick={() => setSelectedLead(i)}
              className={`p-3 sm:p-4 cursor-pointer transition-all duration-300 ${
                selectedLead === i
                  ? 'bg-indigo-500/20 border-l-2 border-indigo-500'
                  : 'hover:bg-white/5'
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                    {lead.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-medium text-white truncate">{lead.name}</div>
                    <div className="text-[10px] sm:text-xs text-white/60 truncate">{lead.company}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                  <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                    lead.status === 'Hot' ? 'bg-red-500/20 text-red-400' :
                    lead.status === 'Warm' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {lead.status}
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-emerald-400 hidden sm:inline">{lead.value}</span>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-white/40" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Detail Panel - Slides in, hidden on mobile by default */}
      {selectedLead !== null && (
        <div className="hidden lg:block bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 p-4 sm:p-6 animate-in slide-in-from-right duration-500">
          <div className="text-center mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg sm:text-2xl mx-auto mb-2 sm:mb-3">
              {leads[selectedLead].name.split(' ').map(n => n[0]).join('')}
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-white">{leads[selectedLead].name}</h3>
            <p className="text-xs sm:text-sm text-white/60">{leads[selectedLead].company}</p>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-white/60 flex-shrink-0" />
              <span className="text-white/80 truncate">+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
              <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-white/60 flex-shrink-0" />
              <span className="text-white/80 truncate">sarah@techinnovators.com</span>
            </div>
            <div className="pt-3 sm:pt-4 border-t border-white/10">
              <div className="text-[10px] sm:text-xs text-white/60 mb-2">Lead Score</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                    style={{ width: `${leads[selectedLead].score}%` }}
                  />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-white">{leads[selectedLead].score}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Section 3: Sales Pipeline - Stub for now, will implement full Kanban
function SalesPipeline() {
  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="text-center">
        <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-indigo-400 mx-auto mb-3 sm:mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Sales Pipeline</h2>
        <p className="text-sm sm:text-base text-white/60">Kanban board with drag & drop</p>
      </div>
    </div>
  );
}

// Section 4: WhatsApp Inbox - Stub
function WhatsAppInbox() {
  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="text-center">
        <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-green-400 mx-auto mb-3 sm:mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">WhatsApp Inbox</h2>
        <p className="text-sm sm:text-base text-white/60">Live conversations with typing indicators</p>
      </div>
    </div>
  );
}

// Section 5: Analytics - Stub
function AnalyticsDashboard() {
  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="text-center">
        <DollarSign className="h-12 w-12 sm:h-16 sm:w-16 text-emerald-400 mx-auto mb-3 sm:mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Analytics & Reports</h2>
        <p className="text-sm sm:text-base text-white/60">Real-time metrics and insights</p>
      </div>
    </div>
  );
}

// Section 6: Automation - Stub
function AutomationBuilder() {
  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="text-center">
        <Zap className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-400 mx-auto mb-3 sm:mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Automation Builder</h2>
        <p className="text-sm sm:text-base text-white/60">Visual workflow editor</p>
      </div>
    </div>
  );
}

// Section 7: Team - Stub
function TeamCollaboration() {
  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="text-center">
        <Users className="h-12 w-12 sm:h-16 sm:w-16 text-blue-400 mx-auto mb-3 sm:mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Team Collaboration</h2>
        <p className="text-sm sm:text-base text-white/60">Real-time collaboration tools</p>
      </div>
    </div>
  );
}

// Section 8: Settings - Stub
function SettingsPanel() {
  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="text-center">
        <Settings className="h-12 w-12 sm:h-16 sm:w-16 text-purple-400 mx-auto mb-3 sm:mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">Settings & Integrations</h2>
        <p className="text-sm sm:text-base text-white/60">Customize your workspace</p>
      </div>
    </div>
  );
}

// Section 9: Final Hero
function FinalHero() {
  return (
    <div className="h-full flex items-center justify-center px-4">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 animate-in fade-in duration-700">
          Ready to Transform Your Business?
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white/70 mb-6 sm:mb-8 animate-in fade-in duration-700 delay-200">
          Join thousands of teams already growing with NexaCRM
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform duration-300 shadow-2xl text-sm sm:text-base">
            Start Free Trial
          </button>
          <button className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 text-sm sm:text-base">
            Book Demo
          </button>
        </div>
      </div>
    </div>
  );
}
