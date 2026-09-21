'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell, Sun, Moon, LogOut, User, ChevronDown, Search, Plus, HelpCircle,
  LayoutDashboard, Users, Lightbulb, Briefcase, MessageSquare,
  CheckSquare, Calendar, BarChart2, UserCog, Settings,
  Bot, Zap, MessageCircle, BookOpen, FileText, Headphones,
  Gift, Menu, X, Command
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';
import { Avatar } from '@/components/ui/avatar';
import { apiClient } from '@/lib/api-client';
import { formatRelative } from '@/lib/format';
import { useState, useRef, useEffect } from 'react';
import { disconnectSocket } from '@/lib/socket-client';

type MegaMenuType = 'platform' | 'solutions' | 'resources' | null;

const platformMenuItems = {
  crm: {
    title: 'CRM',
    items: [
      { href: '/contacts', label: 'Contacts', icon: Users, description: 'Manage customers and organizations' },
      { href: '/leads', label: 'Leads', icon: Lightbulb, description: 'Capture and qualify prospects' },
      { href: '/deals', label: 'Deals', icon: Briefcase, description: 'Track and manage opportunities' },
      { href: '/inbox', label: 'Inbox', icon: MessageSquare, description: 'Manage conversations', badge: 'inbox' },
    ]
  },
  workspace: {
    title: 'Workspace',
    items: [
      { href: '/tasks', label: 'Tasks', icon: CheckSquare, description: 'Manage activities and follow-ups' },
      { href: '/calendar', label: 'Calendar', icon: Calendar, description: 'Schedule meetings and events' },
      { href: '/reports', label: 'Reports', icon: BarChart2, description: 'Business performance insights' },
      { href: '/team', label: 'Team', icon: UserCog, description: 'Manage workspace members' },
    ]
  },
  ai: {
    title: 'AI & Automation',
    items: [
      { href: '/settings/ai', label: 'AI Assistant', icon: Bot, description: 'Intelligent CRM assistance' },
      { href: '/settings/whatsapp', label: 'WhatsApp', icon: MessageCircle, description: 'Customer communication' },
    ]
  }
};

const solutionsMenuItems = {
  sales: {
    title: 'Sales',
    items: [
      { href: '/leads', label: 'Lead Management', icon: Lightbulb, description: 'Capture and nurture leads' },
      { href: '/deals', label: 'Deal Pipeline', icon: Briefcase, description: 'Visual sales pipeline' },
      { href: '/tasks', label: 'Follow-ups', icon: CheckSquare, description: 'Never miss a follow-up' },
    ]
  },
  customers: {
    title: 'Customer Management',
    items: [
      { href: '/contacts', label: 'Contacts', icon: Users, description: 'Complete customer profiles' },
      { href: '/inbox', label: 'Conversations', icon: MessageSquare, description: 'All customer interactions' },
      { href: '/reports', label: 'Insights', icon: BarChart2, description: 'Customer analytics' },
    ]
  },
  team: {
    title: 'Team Collaboration',
    items: [
      { href: '/team', label: 'Team', icon: UserCog, description: 'Workspace collaboration' },
      { href: '/calendar', label: 'Calendar', icon: Calendar, description: 'Shared schedules' },
      { href: '/reports', label: 'Performance', icon: BarChart2, description: 'Team metrics' },
    ]
  }
};

const resourcesMenuItems = {
  learn: {
    title: 'Learn',
    items: [
      { href: '/help', label: 'Help Center', icon: HelpCircle, description: 'Get answers and guidance' },
      { href: '/help/docs', label: 'Documentation', icon: BookOpen, description: 'Detailed guides' },
    ]
  },
  support: {
    title: 'Support',
    items: [
      { href: '/help/support', label: 'Support', icon: Headphones, description: 'Get help from our team' },
      { href: '/settings', label: 'Settings', icon: Settings, description: 'Configure your workspace' },
    ]
  }
};

export function PremiumNavigation() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, isOpen, setOpen, markAllAsRead } = useNotificationStore();
  const router = useRouter();
  
  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuType>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      
      // Check if clicking on a Link element or inside one
      const clickedLink = target.closest('a[href]');
      if (clickedLink && megaMenuRef.current?.contains(clickedLink)) {
        // Allow navigation, just close the menu
        setActiveMegaMenu(null);
        return;
      }
      
      if (notifRef.current && !notifRef.current.contains(target)) setOpen(false);
      if (userRef.current && !userRef.current.contains(target)) setUserMenuOpen(false);
      if (quickRef.current && !quickRef.current.contains(target)) setQuickActionsOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(target)) setMobileMenuOpen(false);
      
      // Close mega menu if clicking outside
      if (megaMenuRef.current && !megaMenuRef.current.contains(target)) {
        setActiveMegaMenu(null);
      }
    }
    
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setActiveMegaMenu(null);
        setUserMenuOpen(false);
        setQuickActionsOpen(false);
        setMobileMenuOpen(false);
      }
    }
    
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [setOpen]);

  async function handleLogout() {
    try { await apiClient.post('/auth/logout'); } catch { /* continue */ }
    disconnectSocket();
    logout();
    router.push('/login');
  }

  const MegaMenuItem = ({ item, onClick }: { item: any; onClick?: () => void }) => {
    const isActive = pathname.startsWith(item.href);
    const Icon = item.icon;
    const badge = item.badge === 'inbox' ? unreadCount : 0;

    return (
      <Link
        href={item.href}
        onClick={() => {
          // Close menu when navigating
          if (onClick) {
            onClick();
          }
        }}
        className={cn(
          'group flex items-start gap-3 p-3 rounded-lg transition-all duration-150',
          'hover:bg-muted',
          isActive && 'bg-primary-soft'
        )}
      >
        <Icon className={cn(
          'h-5 w-5 flex-shrink-0 mt-0.5 transition-colors',
          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'
        )} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-sm font-semibold transition-colors',
              isActive ? 'text-primary' : 'text-foreground'
            )}>
              {item.label}
            </span>
            {badge > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {item.description}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <>
      {/* Main Navigation Bar */}
      <div className="h-full flex items-center justify-between px-6 bg-white/95 dark:bg-card/95 backdrop-blur-xl border-b border-border">
        {/* Left: Logo + Main Navigation */}
        <div className="flex items-center gap-8">
          {/* Mobile Menu Button */}
          <div ref={mobileRef} className="lg:hidden relative">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gunmetal dark:text-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
              <div className="absolute left-0 top-12 w-72 rounded-xl border border-border bg-card shadow-premium-xl animate-scale-in z-50 max-h-[calc(100vh-5rem)] overflow-y-auto">
                <div className="p-2">
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-foreground hover:bg-muted">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Link>
                  
                  {/* CRM Section */}
                  <div className="mt-4 px-3 mb-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CRM</p>
                  </div>
                  {platformMenuItems.crm.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                  
                  {/* Workspace Section */}
                  <div className="mt-4 px-3 mb-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Workspace</p>
                  </div>
                  {platformMenuItems.workspace.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-lg font-bold text-gunmetal dark:text-white tracking-tight hidden sm:block">
              NexaCRM
            </span>
          </Link>

          {/* Main Navigation */}
          <nav ref={megaMenuRef} className="hidden lg:flex items-center gap-1" role="navigation">
            {/* Dashboard */}
            <Link
              href="/dashboard"
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                pathname === '/dashboard'
                  ? 'text-primary bg-primary-soft'
                  : 'text-gunmetal-light dark:text-foreground hover:text-primary hover:bg-muted'
              )}
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>

            {/* Platform Mega Menu */}
            <button
              onClick={() => setActiveMegaMenu(activeMegaMenu === 'platform' ? null : 'platform')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                activeMegaMenu === 'platform'
                  ? 'text-primary bg-primary-soft'
                  : 'text-gunmetal-light dark:text-foreground hover:text-primary hover:bg-muted'
              )}
              aria-expanded={activeMegaMenu === 'platform'}
            >
              Platform
              <ChevronDown className={cn("h-3 w-3 transition-transform", activeMegaMenu === 'platform' && "rotate-180")} />
            </button>

            {/* Solutions Mega Menu */}
            <button
              onClick={() => setActiveMegaMenu(activeMegaMenu === 'solutions' ? null : 'solutions')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                activeMegaMenu === 'solutions'
                  ? 'text-primary bg-primary-soft'
                  : 'text-gunmetal-light dark:text-foreground hover:text-primary hover:bg-muted'
              )}
              aria-expanded={activeMegaMenu === 'solutions'}
            >
              Solutions
              <ChevronDown className={cn("h-3 w-3 transition-transform", activeMegaMenu === 'solutions' && "rotate-180")} />
            </button>

            {/* Resources Mega Menu */}
            <button
              onClick={() => setActiveMegaMenu(activeMegaMenu === 'resources' ? null : 'resources')}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                activeMegaMenu === 'resources'
                  ? 'text-primary bg-primary-soft'
                  : 'text-gunmetal-light dark:text-foreground hover:text-primary hover:bg-muted'
              )}
              aria-expanded={activeMegaMenu === 'resources'}
            >
              Resources
              <ChevronDown className={cn("h-3 w-3 transition-transform", activeMegaMenu === 'resources' && "rotate-180")} />
            </button>
          </nav>
        </div>

        {/* Right: Search + Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Search */}
          <div className="hidden md:block">
            <div className={cn(
              "relative transition-all duration-200",
              searchFocused && "scale-[1.02]"
            )}>
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
                searchFocused ? "text-primary" : "text-muted-foreground"
              )} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  }
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={cn(
                  "w-32 md:w-40 lg:w-48 xl:w-64 h-9 pl-10 pr-3 xl:pr-14 rounded-lg border transition-all duration-200",
                  "text-sm placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20",
                  searchFocused 
                    ? "border-primary shadow-sm bg-card text-foreground" 
                    : "border-border bg-muted text-foreground hover:bg-card"
                )}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden xl:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </div>

          {/* Quick Actions */}
          <div ref={quickRef} className="relative">
            <button
              onClick={() => setQuickActionsOpen(!quickActionsOpen)}
              className="flex h-9 items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-medium shadow-sm hover:shadow-md transition-all duration-150"
            >
              <Plus className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline whitespace-nowrap">New</span>
            </button>

            {/* Quick Actions Dropdown */}
            {quickActionsOpen && (
              <div className="absolute right-0 top-12 w-56 rounded-xl border border-border bg-card shadow-premium-xl animate-scale-in z-50">
                <div className="p-2 space-y-1">
                  <Link
                    href="/contacts?create=true"
                    onClick={() => setQuickActionsOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors group"
                  >
                    <User className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    <span className="flex-1 font-medium">New Contact</span>
                  </Link>
                  <Link
                    href="/leads?create=true"
                    onClick={() => setQuickActionsOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors group"
                  >
                    <Lightbulb className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    <span className="flex-1 font-medium">New Lead</span>
                  </Link>
                  <Link
                    href="/deals?create=true"
                    onClick={() => setQuickActionsOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors group"
                  >
                    <Briefcase className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    <span className="flex-1 font-medium">New Deal</span>
                  </Link>
                  <Link
                    href="/tasks?create=true"
                    onClick={() => setQuickActionsOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors group"
                  >
                    <CheckSquare className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    <span className="flex-1 font-medium">New Task</span>
                  </Link>
                  <Link
                    href="/calendar?create=true"
                    onClick={() => setQuickActionsOpen(false)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted transition-colors group"
                  >
                    <Calendar className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    <span className="flex-1 font-medium">Schedule Meeting</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-gunmetal-light dark:text-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
          >
            {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setOpen(!isOpen)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gunmetal-light dark:text-foreground hover:text-foreground hover:bg-muted transition-all duration-150"
            >
              <Bell className="h-[18px] w-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="absolute right-0 top-12 w-96 rounded-xl border border-border bg-card shadow-premium-xl animate-scale-in z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs text-primary hover:text-primary-hover font-medium">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center">
                      <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                      <p className="text-sm text-muted-foreground">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div 
                        key={n.id} 
                        className={cn(
                          'flex gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0',
                          !n.isRead && 'bg-blue-50 dark:bg-blue-900/10'
                        )}
                      >
                        <div className={cn('mt-1 h-2 w-2 rounded-full flex-shrink-0', !n.isRead ? 'bg-primary' : 'bg-transparent')} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{n.title}</p>
                          {n.body && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.body}</p>}
                          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{formatRelative(n.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          {user && (
            <div ref={userRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150"
              >
                <Avatar firstName={user.firstName} lastName={user.lastName} src={user.avatarUrl} size="sm" />
                <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-12 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl animate-scale-in z-50">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{user.email}</p>
                  </div>
                  <div className="p-2">
                    <Link href="/settings" className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mega Menus */}
      {activeMegaMenu && (
        <div className="absolute left-0 right-0 top-full bg-card/98 backdrop-blur-xl border-b border-border shadow-premium-xl animate-fade-in-up z-40">
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Platform Menu */}
            {activeMegaMenu === 'platform' && (
              <div className="grid grid-cols-3 gap-8">
                {/* CRM Column */}
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    {platformMenuItems.crm.title}
                  </h3>
                  <div className="space-y-1">
                    {platformMenuItems.crm.items.map((item) => (
                      <MegaMenuItem key={item.href} item={item} onClick={() => setActiveMegaMenu(null)} />
                    ))}
                  </div>
                </div>

                {/* Workspace Column */}
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    {platformMenuItems.workspace.title}
                  </h3>
                  <div className="space-y-1">
                    {platformMenuItems.workspace.items.map((item) => (
                      <MegaMenuItem key={item.href} item={item} onClick={() => setActiveMegaMenu(null)} />
                    ))}
                  </div>
                </div>

                {/* AI & Automation Column */}
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    {platformMenuItems.ai.title}
                  </h3>
                  <div className="space-y-1">
                    {platformMenuItems.ai.items.map((item) => (
                      <MegaMenuItem key={item.href} item={item} onClick={() => setActiveMegaMenu(null)} />
                    ))}
                  </div>
                  
                  {/* Featured Area - Subtle Tan Accent */}
                  <div className="mt-6 p-4 rounded-lg bg-tan-soft dark:bg-tan-soft/10 border border-tan/20">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                          <Zap className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground mb-1">NexaCRM AI</p>
                        <p className="text-xs text-muted-foreground mb-3">Automate repetitive work with intelligent workflows</p>
                        <Link 
                          href="/settings/ai"
                          onClick={() => setActiveMegaMenu(null)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
                        >
                          Explore AI →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Solutions Menu */}
            {activeMegaMenu === 'solutions' && (
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    {solutionsMenuItems.sales.title}
                  </h3>
                  <div className="space-y-1">
                    {solutionsMenuItems.sales.items.map((item) => (
                      <MegaMenuItem key={item.href} item={item} onClick={() => setActiveMegaMenu(null)} />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    {solutionsMenuItems.customers.title}
                  </h3>
                  <div className="space-y-1">
                    {solutionsMenuItems.customers.items.map((item) => (
                      <MegaMenuItem key={item.href} item={item} onClick={() => setActiveMegaMenu(null)} />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    {solutionsMenuItems.team.title}
                  </h3>
                  <div className="space-y-1">
                    {solutionsMenuItems.team.items.map((item) => (
                      <MegaMenuItem key={item.href} item={item} onClick={() => setActiveMegaMenu(null)} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Resources Menu */}
            {activeMegaMenu === 'resources' && (
              <div className="grid grid-cols-2 gap-8 max-w-2xl">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                    {resourcesMenuItems.learn.title}
                  </h3>
                  <div className="space-y-1">
                    {resourcesMenuItems.learn.items.map((item) => (
                      <MegaMenuItem key={item.href} item={item} onClick={() => setActiveMegaMenu(null)} />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
                    {resourcesMenuItems.support.title}
                  </h3>
                  <div className="space-y-1">
                    {resourcesMenuItems.support.items.map((item) => (
                      <MegaMenuItem key={item.href} item={item} onClick={() => setActiveMegaMenu(null)} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
