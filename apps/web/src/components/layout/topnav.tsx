'use client';

import { Bell, Moon, Sun, LogOut, User, ChevronDown, Search, Plus, HelpCircle, Command, Briefcase, CheckSquare, Calendar, Menu } from 'lucide-react';
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
import { InstallButton } from '@/components/pwa';

export function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, isOpen, setOpen, markAllAsRead } = useNotificationStore();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const quickRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) setQuickActionsOpen(false);
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
    <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8 glass-strong bg-card border-b border-border">
      {/* Mobile Menu Button - Left Side */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-muted transition-all duration-200"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Search Bar - Left Side on desktop, center on mobile */}
      <div className="flex-1 max-w-2xl">
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
            placeholder="Search contacts, deals, tasks..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={cn(
              "w-full h-10 pl-10 pr-20 rounded-xl border-2 transition-all duration-200",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
              searchFocused 
                ? "border-primary shadow-lg bg-card" 
                : "border-input bg-muted/30 hover:bg-card hover:border-border"
            )}
          />
          <div className="absolute inset-y-0 right-3 flex items-center gap-1 pointer-events-none">
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 ml-4 sm:ml-6">
        {/* Install App Button */}
        <InstallButton />
        
        {/* Quick Add Button */}
        <div ref={quickRef} className="relative">
          <button
            onClick={() => setQuickActionsOpen(!quickActionsOpen)}
            className="flex h-10 items-center gap-2 px-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-sm font-medium shadow-premium-sm hover:shadow-premium-md hover:scale-105 transition-all duration-200 group"
          >
            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
            <span className="hidden sm:inline">New</span>
          </button>

          {/* Quick Actions Dropdown */}
          {quickActionsOpen && (
            <div className="absolute right-0 top-12 w-56 rounded-xl border border-border glass-strong shadow-premium-xl animate-scale-in z-50">
              <div className="p-2 space-y-1">
                {[
                  { label: 'New Contact', icon: User, shortcut: 'C', path: '/contacts' },
                  { label: 'New Deal', icon: Briefcase, shortcut: 'D', path: '/deals' },
                  { label: 'New Task', icon: CheckSquare, shortcut: 'T', path: '/tasks' },
                  { label: 'Schedule Meeting', icon: Calendar, shortcut: 'M', path: '/calendar' },
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      router.push(action.path);
                      setQuickActionsOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-muted/50 transition-colors group"
                  >
                    <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="flex-1 text-left font-medium">{action.label}</span>
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      {action.shortcut}
                    </kbd>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Help Button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-muted transition-all duration-200 hover:scale-105"
          aria-label="Help"
        >
          <HelpCircle className="h-[18px] w-[18px]" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-muted transition-all duration-200 hover:scale-105"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setOpen(!isOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:text-primary hover:bg-muted transition-all duration-200 hover:scale-105"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-destructive to-pink-600 px-1 text-[10px] font-bold text-white shadow-lg shadow-destructive/30 animate-pulse-subtle">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {isOpen && (
            <div className="absolute right-0 top-12 w-96 rounded-xl border border-border glass-strong shadow-premium-xl animate-scale-in z-50">
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
              className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-muted transition-all duration-200 group"
            >
              <Avatar firstName={user.firstName} lastName={user.lastName} src={user.avatarUrl} size="sm" className="ring-2 ring-border group-hover:ring-primary/30 transition-all" />
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-foreground truncate max-w-32">
                  {user.firstName}
                </p>
                <p className="text-xs text-muted-foreground truncate max-w-32">
                  {user.email}
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-12 w-64 rounded-xl border border-border glass-strong shadow-premium-xl animate-scale-in z-50">
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
