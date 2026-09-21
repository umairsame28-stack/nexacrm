'use client';

import { ArrowUpRight, TrendingUp, Users, Plus, Upload, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatPercent } from '@/lib/format';
import { cn } from '@/lib/cn';
import { CRMNetworkBackground } from './crm-network-background';

interface WelcomeHeroProps {
  userName: string;
  greeting: string;
  revenue: number;
  revenueChange: number;
  totalContacts: number;
}

export function WelcomeHero({ userName, greeting, revenue, revenueChange, totalContacts }: WelcomeHeroProps) {
  const router = useRouter();
  const isPositive = revenueChange >= 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border p-8 shadow-premium-lg bg-gradient-to-br from-background to-muted/30">
      {/* CRM Network Background - Subtle animated background */}
      <CRMNetworkBackground />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-accent/5 rounded-full blur-3xl -z-0 animate-pulse-subtle" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-accent/5 to-primary/5 rounded-full blur-3xl -z-0" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        {/* Left Content */}
        <div className="flex-1 space-y-6">
          {/* Greeting */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse-subtle" />
              <span className="text-xs font-medium text-primary">Live Dashboard</span>
            </div>
            <h1 className="text-hero text-foreground">
              {greeting}, <span className="text-primary font-bold">{userName}</span> 👋
            </h1>
            <p className="text-base text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>

          {/* Revenue Highlight */}
          <div className="inline-flex flex-col gap-2 p-6 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10 backdrop-blur-sm">
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-medium text-muted-foreground">Your business generated</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-foreground tabular-nums">{formatCurrency(revenue)}</span>
              <div className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold",
                isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
              )}>
                <TrendingUp className={cn("h-4 w-4", !isPositive && "rotate-180")} />
                {formatPercent(Math.abs(revenueChange))}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {isPositive ? 'more' : 'less'} than last month
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{totalContacts.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total Contacts</p>
              </div>
            </div>
          </div>

          {/* Action Buttons - Placeholders for Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => router.push('/contacts')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-premium-md hover:shadow-premium-lg hover:scale-105 transition-all duration-200 group"
            >
              <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
              Add Contact
            </button>
            <button 
              onClick={() => router.push('/deals')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gunmetal text-white text-sm font-semibold shadow-premium-md hover:shadow-premium-lg hover:scale-105 transition-all duration-200 group"
            >
              <Calendar className="h-4 w-4 group-hover:scale-110 transition-transform" />
              Create Deal
            </button>
            <button 
              onClick={() => router.push('/leads')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-primary bg-primary-soft text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-all duration-200 group"
            >
              <Upload className="h-4 w-4 group-hover:-translate-y-0.5 transition-transform" />
              Import Leads
            </button>
          </div>
        </div>

        {/* Right Illustration */}
        <div className="hidden lg:block relative w-80 h-80 flex-shrink-0">
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Animated circles */}
            <div className="absolute w-64 h-64 rounded-full border-2 border-primary/20 animate-pulse-subtle" />
            <div className="absolute w-52 h-52 rounded-full border-2 border-accent/20 animate-pulse-subtle" style={{ animationDelay: '0.5s' }} />
            <div className="absolute w-40 h-40 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-xl animate-float" />
            
            {/* Floating cards */}
            <div className="absolute top-8 right-8 p-4 rounded-xl bg-white dark:bg-card border border-border shadow-premium-lg animate-float" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Revenue</p>
                  <p className="text-lg font-bold text-foreground">+24%</p>
                </div>
              </div>
            </div>
            
            <div className="absolute bottom-8 left-8 p-4 rounded-xl bg-white dark:bg-card border border-border shadow-premium-lg animate-float" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">New Leads</p>
                  <p className="text-lg font-bold text-foreground">156</p>
                </div>
              </div>
            </div>
            
            {/* Center glow */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-32 w-32 rounded-full bg-gradient-to-br from-primary via-accent to-primary opacity-20 blur-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
