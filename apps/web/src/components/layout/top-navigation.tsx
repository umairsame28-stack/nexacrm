'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell, Moon, Sun, LogOut, User, ChevronDown, Search, Plus, HelpCircle, Command,
  LayoutDashboard, Users, Lightbulb, Briefcase, MessageSquare,
  CheckSquare, Calendar, BarChart2, UserCog, Settings, MoreHorizontal, Menu, X
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

const primaryNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/leads', label: 'Leads', icon: Lightbulb },
  { href: '/deals', label: 'Deals', icon: Briefcase },
  { href: '/inbox', label: 'Inbox', icon: MessageSquare, badge: 'inbox' },
];

const secondaryNav = [
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/reports', label: 'Reports', icon: BarChart2 },
  { href: '/team', label: 'Team', icon: UserCog },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function TopNavigation() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, isOpen, setOpen, markAllAsRead } = useNotificationStore();
  const router = useRouter();
  
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreMenuOpen(false);
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) setQuickActionsOpen(false);
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) setMobileMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [setOpen]);

  async function handleLogout() {
    try { await apiClient.post('/auth/logout'); } catch { /* continue */ }
    disconnectSocket();
    logout();
    router.push('/login');
  }

  return (
    <div className="h-full flex items-center justify-between px-6 bg-card/95 backdrop-blur-xl border-b border-border">
      {/* Left: Logo + Primary Navigation */}
      <div className="flex items-center gap-8">
        {/* Mobile Menu Button */}
        <div ref={mobileRef} className="lg:hidden relative">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-all duration-200"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="absolute left-0 top-12 w-64 rounded-xl border border-border bg-popover shadow-xl animate-scale-in z-50 max-h-[calc(100vh-5rem)] overflow-y-auto">
              <div className="p-2">
                {/* Primary Navigation */}
                {primaryNav.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  const badge = item.badge === 'inbox' ? unreadCount : 0;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground hover:bg-muted/50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      {badge > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </Link>
                  );
                })}

                {/* Divider */}
                <div className="my-2 h-px bg-border" />

                {/* Secondary Navigation */}
                {secondaryNav.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group',
                        isActive
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-foreground hover:bg-muted/50'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight hidden sm:block">
            NexaCRM
          </span>
        </Link>

        {/* Primary Navigation */}
        <nav className="hidden lg:flex items-center gap-1" role="navigation" aria-label="Primary navigation">
          {primaryNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            const badge = item.badge === 'inbox' ? unreadCount : 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {badge > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* More Dropdown */}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150',
                moreMenuOpen || secondaryNav.some(item => pathname.startsWith(item.href))
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
              aria-expanded={moreMenuOpen}
              aria-haspopup="true"
            >
              <MoreHorizontal className="h-4 w-4" />
              <span>More</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", moreMenuOpen && "rotate-180")} />
            </button>

            {moreMenuOpen && (
              <div className="absolute left-0 top-12 w-48 rounded-xl border border-border bg-popover shadow-xl animate-scale-in z-50">
                <div className="p-2 space-y-1">
                  {secondaryNav.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreMenuOpen(false)}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group',
                          isActive
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-foreground hover:bg-muted/50'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        {isActive && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Right: Search + Actions + User */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Search - hidden on small screens, compact on medium */}
        <div className="hidden md:block">
          <div className={cn(
            "relative group transition-all duration-200",
            searchFocused && "scale-[1.02]"
          )}>
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className={cn(
                "h-4 w-4 transition-colors duration-200",
                searchFocused ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <input
              type="text"
              placeholder="Search..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                "w-32 md:w-40 lg:w-48 xl:w-64 h-9 pl-10 pr-3 xl:pr-14 rounded-lg border transition-all duration-200",
                "text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
                searchFocused 
                  ? "border-primary shadow-sm bg-card" 
                  : "border-border bg-muted/30 hover:bg-card hover:border-border"
              )}
            />
            <div className="absolute inset-y-0 right-3 hidden xl:flex items-center gap-1 pointer-events-none">
              <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <Command className="h-3 w-3" />K
              </kbd>
            </div>
          </div>
        </div>

        {/* Search icon for mobile */}
        <button
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-all duration-200"
          aria-label="Search"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        {/* Quick Add Button */}
        <div ref={quickRef} className="relative">
          <button
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            className="flex h-9 items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 rounded-lg bg-gradient-to-r from-primary to-accent text-white text-sm font-medium shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 group"
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200 flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">New</span>
          </button>

          {quickActionsOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-border bg-popover shadow-xl animate-scale-in z-50">
              <div className="p-2 space-y-1">
                {[
                  { label: 'New Contact', icon: User },
                  { label: 'New Deal', icon: Briefcase },
                  { label: 'New Task', icon: CheckSquare },
                  { label: 'Schedule Meeting', icon: Calendar },
                ].map((action, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors group"
                  >
                    <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="flex-1 text-left font-medium">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help Button */}
        <button
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-all duration-200"
          aria-label="Help"
        >
          <HelpCircle className="h-[18px] w-[18px]" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-all duration-200"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setOpen(!isOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-all duration-200"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 top-12 w-96 rounded-xl border border-border bg-popover shadow-xl animate-scale-in z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-primary hover:text-primary/80 font-medium transition-colors">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        'flex gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors border-b border-border/50 last:border-0',
                        !n.isRead && 'bg-primary/5'
                      )}
                    >
                      <div className={cn(
                        'mt-1 h-2 w-2 rounded-full flex-shrink-0',
                        !n.isRead ? 'bg-primary' : 'bg-transparent'
                      )} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                        {n.body && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>}
                        <p className="mt-1 text-xs text-muted-foreground/70">{formatRelative(n.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border mx-1" />

        {/* User Menu */}
        {user && (
          <div ref={userRef} className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-all duration-200 group"
            >
              <Avatar 
                firstName={user.firstName} 
                lastName={user.lastName} 
                src={user.avatarUrl} 
                size="sm" 
                className="ring-2 ring-border group-hover:ring-primary/30 transition-all" 
              />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-foreground truncate max-w-32">
                  {user.firstName}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-32">
                  {user.email}
                </p>
              </div>
              <ChevronDown className="hidden lg:block h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-12 w-64 rounded-xl border border-border bg-popover shadow-xl animate-scale-in z-50">
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-semibold text-sm text-foreground">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{user.email}</p>
                </div>
                <div className="p-2">
                  <button className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors group">
                    <User className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="font-medium">Profile Settings</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors group"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
