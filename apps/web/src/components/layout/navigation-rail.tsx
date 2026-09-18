'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Lightbulb, Briefcase, MessageSquare,
  CheckSquare, Calendar, BarChart2, UserCog, Settings, 
  HelpCircle, ChevronRight, ChevronLeft
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useNotificationStore } from '@/stores/notification.store';
import { Avatar } from '@/components/ui/avatar';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'main' },
  { href: '/contacts', label: 'Contacts', icon: Users, group: 'main' },
  { href: '/leads', label: 'Leads', icon: Lightbulb, group: 'main' },
  { href: '/deals', label: 'Deals', icon: Briefcase, group: 'main' },
  { href: '/inbox', label: 'Inbox', icon: MessageSquare, group: 'main', badge: 'inbox' },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare, group: 'tools' },
  { href: '/calendar', label: 'Calendar', icon: Calendar, group: 'tools' },
  { href: '/reports', label: 'Reports', icon: BarChart2, group: 'tools' },
  { href: '/team', label: 'Team', icon: UserCog, group: 'admin' },
];

const groups = [
  { key: 'main', label: 'MAIN' },
  { key: 'tools', label: 'TOOLS' },
  { key: 'admin', label: 'WORKSPACE' },
];

interface NavigationRailProps {
  onNavigate?: () => void;
}

export function NavigationRail({ onNavigate }: NavigationRailProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, workspace } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div
      className={cn(
        'h-full flex flex-col bg-card border-r border-border transition-all duration-200 relative',
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo Section */}
      <div className="flex h-[72px] items-center justify-center flex-shrink-0 border-b border-border px-4">
        <div className={cn(
          'flex items-center gap-3 min-w-0 transition-all duration-200',
          sidebarCollapsed ? 'justify-center' : 'justify-start w-full'
        )}>
          <div className="relative h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0 shadow-sm hover:shadow-md transition-shadow">
            <span className="text-white font-bold text-sm">N</span>
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="text-foreground font-bold text-base tracking-tight">
                NexaCRM
              </span>
              <span className="text-muted-foreground text-[10px] font-medium">
                Premium Edition
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav 
        className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide"
        role="navigation"
        aria-label="Main navigation"
      >
        {groups.map((group, groupIndex) => {
          const groupItems = navItems.filter((i) => i.group === group.key);
          return (
            <div key={group.key} className={cn(groupIndex > 0 && 'mt-6')}>
              {!sidebarCollapsed && (
                <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  {group.label}
                </div>
              )}
              {sidebarCollapsed && groupIndex > 0 && (
                <div className="my-3 mx-auto w-8 h-px bg-border" />
              )}
              <div className="space-y-1">
                {groupItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;
                  const badge = item.badge === 'inbox' ? unreadCount : 0;
                  const isHovered = hoveredItem === item.href;

                  return (
                    <div key={item.href} className="relative">
                      <Link
                        href={item.href}
                        prefetch={true}
                        onClick={onNavigate}
                        onMouseEnter={() => setHoveredItem(item.href)}
                        onMouseLeave={() => setHoveredItem(null)}
                        aria-label={sidebarCollapsed ? item.label : undefined}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                          sidebarCollapsed && 'justify-center',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                      >
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r-full bg-primary" />
                        )}

                        <div className={cn(
                          'relative flex items-center flex-shrink-0',
                          sidebarCollapsed ? 'w-full justify-center' : 'gap-3 flex-1 min-w-0'
                        )}>
                          <Icon 
                            className={cn(
                              "h-[18px] w-[18px] flex-shrink-0 transition-transform duration-150",
                              isActive && "scale-110"
                            )} 
                          />
                          
                          {!sidebarCollapsed && (
                            <span className="truncate">{item.label}</span>
                          )}
                          
                          {/* Badge - expanded */}
                          {!sidebarCollapsed && badge > 0 && (
                            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                              {badge > 99 ? '99+' : badge}
                            </span>
                          )}
                          
                          {/* Badge - collapsed */}
                          {sidebarCollapsed && badge > 0 && (
                            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
                          )}
                        </div>
                      </Link>

                      {/* Tooltip for collapsed state */}
                      {sidebarCollapsed && isHovered && (
                        <div className="fixed left-[84px] z-50 px-3 py-1.5 bg-popover border border-border rounded-lg shadow-lg text-xs font-medium text-popover-foreground whitespace-nowrap pointer-events-none animate-fade-in-scale">
                          {item.label}
                          {badge > 0 && (
                            <span className="ml-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
                              {badge > 99 ? '99+' : badge}
                            </span>
                          )}
                          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-0 h-0 border-4 border-transparent border-r-popover" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Settings & Help - Bottom section */}
        <div className="mt-6 pt-6 border-t border-border space-y-1">
          {[
            { href: '/settings', label: 'Settings', icon: Settings },
            { href: '/help', label: 'Help', icon: HelpCircle },
          ].map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            const isHovered = hoveredItem === item.href;

            return (
              <div key={item.href} className="relative">
                <Link
                  href={item.href}
                  prefetch={true}
                  onClick={onNavigate}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}
                  aria-label={sidebarCollapsed ? item.label : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150',
                    sidebarCollapsed && 'justify-center',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r-full bg-primary" />
                  )}
                  
                  <Icon className={cn(
                    "h-[18px] w-[18px] flex-shrink-0 transition-transform duration-150",
                    isActive && "scale-110"
                  )} />
                  
                  {!sidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>

                {/* Tooltip for collapsed state */}
                {sidebarCollapsed && isHovered && (
                  <div className="fixed left-[84px] z-50 px-3 py-1.5 bg-popover border border-border rounded-lg shadow-lg text-xs font-medium text-popover-foreground whitespace-nowrap pointer-events-none animate-fade-in-scale">
                    {item.label}
                    <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-0 h-0 border-4 border-transparent border-r-popover" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Profile Section */}
      {user && (
        <div className="flex-shrink-0 p-3 border-t border-border">
          <div className={cn(
            "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-all duration-150 cursor-pointer group relative",
            sidebarCollapsed && "justify-center"
          )}
          role="button"
          tabIndex={0}
          aria-label="User profile menu"
          onMouseEnter={() => setHoveredItem('profile')}
          onMouseLeave={() => setHoveredItem(null)}
          >
            <Avatar
              firstName={user.firstName}
              lastName={user.lastName}
              src={user.avatarUrl}
              size="sm"
              className="ring-2 ring-border/50 group-hover:ring-primary/30 transition-all flex-shrink-0"
            />
            
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 animate-fade-in">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {workspace?.name || 'Workspace'}
                </p>
              </div>
            )}

            {/* Tooltip for collapsed state */}
            {sidebarCollapsed && hoveredItem === 'profile' && (
              <div className="fixed left-[84px] z-50 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg text-xs font-medium text-popover-foreground whitespace-nowrap pointer-events-none animate-fade-in-scale">
                <p className="font-semibold">{user.firstName} {user.lastName}</p>
                <p className="text-muted-foreground">{workspace?.name || 'Workspace'}</p>
                <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-0 h-0 border-4 border-transparent border-r-popover" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapse/Expand Toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-card border-2 border-border text-muted-foreground hover:text-primary hover:border-primary hover:scale-110 transition-all duration-200 shadow-md"
        aria-label={sidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
        aria-expanded={!sidebarCollapsed}
      >
        {sidebarCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </div>
  );
}
