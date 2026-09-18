'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';

const navItems = [
  { href: '/settings/workspace', label: 'Company Profile' },
  { href: '/settings/whatsapp', label: 'WhatsApp' },
  { href: '/settings/ai', label: 'AI Provider' },
  { href: '/settings/smtp', label: 'Email (SMTP)' },
  { href: '/settings/team', label: 'Team & Members' },
  { href: '/settings/api-keys', label: 'API Keys' },
  { href: '/settings/security', label: 'Security' },
  { href: '/settings/audit-log', label: 'Audit Log' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentSection = navItems.find(item => item.href === pathname)?.label ?? 'Settings';

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      {/* Mobile header with menu toggle */}
      <div className="lg:hidden flex items-center justify-between mb-2">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{currentSection}</h1>
          <p className="text-xs text-muted-foreground">Settings</p>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Settings sidebar nav */}
      <aside
        className={cn(
          'w-full lg:w-52 flex-shrink-0 transition-all duration-200',
          mobileMenuOpen ? 'block' : 'hidden lg:block',
        )}
      >
        <h2 className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground hidden lg:block">
          Settings
        </h2>
        <nav className="space-y-0.5" role="navigation" aria-label="Settings navigation">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
