'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Lightbulb, Briefcase, MessageSquare,
  CheckSquare, Calendar, BarChart2, UserCog, Settings, ChevronLeft, ChevronRight,
  Circle, Shield, Building2, Activity
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { Avatar } from '@/components/ui/avatar';
import { useNotificationStore } from '@/stores/notification.store';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  badge?: 'inbox';
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { href: '/contacts', label: 'Contacts', icon: Users, group: 'main' },
  { href: '/leads', label: 'Leads', icon: Lightbulb, group: 'main' },
  { href: '/deals', label: 'Deals', icon: Briefcase, group: 'main' },
  { href: '/inbox', label: 'Inbox', icon: MessageSquare, group: 'main', badge: 'inbox' },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare, group: 'tools' },
  { href: '/calendar', label: 'Calendar', icon: Calendar, group: 'tools' },
  { href: '/reports', label: 'Reports', icon: BarChart2, group: 'tools' },
  { href: '/team', label: 'Team', icon: UserCog, group: 'admin' },
  { href: '/settings', label: 'Settings', icon: Settings, group: 'admin' },
];

const superAdminItems: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: Shield, group: 'superadmin' },
  { href: '/admin/users', label: 'Users', icon: Users, group: 'superadmin' },
  { href: '/admin/workspaces', label: 'Workspaces', icon: Building2, group: 'superadmin' },
  { href: '/admin/system', label: 'System', icon: Activity, group: 'superadmin' },
];

const groups = [
  { key: 'main', label: 'Main' },
  { key: 'tools', label: 'Tools' },
  { key: 'admin', label: 'Admin' },
  { key: 'superadmin', label: 'Super Admin', requiresSuperAdmin: true },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, workspace, isSuperAdmin } = useAuthStore();
  const { unreadCount } = useNotificationStore();

  // Combine regular nav items with super admin items if user is super admin
  const allNavItems = isSuperAdmin() ? [...navItems, ...superAdminItems] : navItems;

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-sidebar">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      {/* Animated ambient glow */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse-subtle pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-pulse-subtle pointer-events-none" style={{ animationDelay: '1s' }} />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo Section */}
        <div className="flex h-[72px] items-center px-6 flex-shrink-0 border-b border-sidebar-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25 group-hover:shadow-primary/40 transition-shadow">
              <span className="text-white font-bold text-base">N</span>
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="text-sidebar-foreground font-bold text-[17px] tracking-tight">
                  NexaCRM
                </span>
                <span className="text-sidebar-foreground/40 text-[11px] font-medium">
                  Premium Edition
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide space-y-8">
          {groups.map((group) => {
            // Skip super admin group if user is not a super admin
            if (group.requiresSuperAdmin && !isSuperAdmin()) {
              return null;
            }

            const groupItems = allNavItems.filter((i) => i.group === group.key);
            
            // Don't render empty groups
            if (groupItems.length === 0) {
              return null;
            }

            return (
              <div key={group.key}>
                {!sidebarCollapsed && (
                  <div className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/30">
                    {group.label}
                  </div>
                )}
                <div className="space-y-1">
                  {groupItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;
                    const badge = item.badge === 'inbox' ? unreadCount : 0;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={true}
                        title={sidebarCollapsed ? item.label : undefined}
                        onClick={onNavigate}
                        className={cn(
                          'group relative flex items-center gap-3 px-3 py-2.5 text-[14px] font-medium rounded-xl transition-all duration-200',
                          isActive
                            ? 'bg-sidebar-foreground/10 text-sidebar-foreground shadow-lg shadow-black/5'
                            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-foreground/5'
                        )}
                      >
                        {/* Active gradient indicator */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 opacity-100 transition-opacity" />
                        )}
                        
                        {/* Left accent bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-gradient-to-b from-primary to-accent" />
                        )}

                        <div className="relative flex items-center gap-3 flex-1 min-w-0">
                          <Icon 
                            className={cn(
                              "h-[18px] w-[18px] flex-shrink-0 transition-all duration-200",
                              isActive && "scale-110",
                              !isActive && "group-hover:scale-105"
                            )} 
                          />
                          
                          {!sidebarCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                          
                          {/* Badge */}
                          {!sidebarCollapsed && badge > 0 && (
                            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-destructive to-pink-600 px-1.5 text-[10px] font-bold text-white shadow-lg shadow-destructive/30">
                              {badge > 99 ? '99+' : badge}
                            </span>
                          )}
                          
                          {sidebarCollapsed && badge > 0 && (
                            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-gradient-to-r from-destructive to-pink-600 shadow-lg shadow-destructive/50" />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Profile Section - Pinned at bottom */}
        {user && (
          <div className="flex-shrink-0 p-4 border-t border-sidebar-border backdrop-blur-sm">
            <div className={cn(
              "flex items-center gap-3 p-3 rounded-xl bg-sidebar-foreground/5 hover:bg-sidebar-foreground/10 transition-all duration-200 cursor-pointer group",
              sidebarCollapsed && "justify-center"
            )}>
              <div className="relative flex-shrink-0">
                <Avatar
                  firstName={user.firstName}
                  lastName={user.lastName}
                  src={user.avatarUrl}
                  size="md"
                  className="ring-2 ring-sidebar-foreground/10 group-hover:ring-sidebar-foreground/20 transition-all"
                />
                {/* Online indicator */}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-sidebar">
                  <Circle className="h-full w-full animate-pulse-subtle" fill="currentColor" />
                </div>
              </div>
              
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-sidebar-foreground/50 truncate">
                    {workspace?.name || 'Workspace'}
                  </p>
                </div>
              )}
              
              {!sidebarCollapsed && (
                <Settings className="h-4 w-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60 transition-colors flex-shrink-0" />
              )}
            </div>
          </div>
        )}

        {/* Collapse Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-110 transition-all duration-200 border border-sidebar-foreground/10"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
      </div>
    </div>
  );
}
