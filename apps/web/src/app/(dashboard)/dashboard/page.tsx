'use client';

import { TrendingUp, TrendingDown, Users, MessageSquare, Lightbulb, DollarSign, Sparkles, X, Target, TrendingUp as Trend, CheckCircle2 } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { WelcomeHero } from '@/components/dashboard/welcome-hero';
import { StatCard } from '@/components/dashboard/stat-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { useDashboard, useAIInsights } from '@/queries/dashboard.queries';
import { formatCurrency, formatPercent, formatRelative, formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth.store';

const priorityColor: Record<string, string> = {
  URGENT: 'text-destructive',
  HIGH: 'text-warning',
  MEDIUM: 'text-primary',
  LOW: 'text-muted-foreground',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data, isLoading } = useDashboard();
  const { data: insights } = useAIInsights();
  const [insightsDismissed, setInsightsDismissed] = useState(false);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  if (isLoading) return <DashboardSkeleton />;

  const kpis = data?.kpis;

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 min-h-screen bg-background px-4 sm:px-0">
      {/* Welcome Hero Section */}
      <WelcomeHero
        userName={user?.firstName ?? 'there'}
        greeting={greeting}
        revenue={kpis?.revenueThisMonth ?? 0}
        revenueChange={kpis?.revenueChange ?? 0}
        totalContacts={kpis?.totalContacts ?? 0}
      />

      {/* AI Insights Banner */}
      {insights?.insights.length && !insightsDismissed && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 sm:p-4 animate-fade-in-up">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="mt-0.5 flex h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-foreground mb-1 sm:mb-1.5">AI Insights</p>
                <ul className="space-y-1">
                  {insights.insights.map((insight, i) => (
                    <li key={i} className="text-xs sm:text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      {insight}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <button onClick={() => setInsightsDismissed(true)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Revenue This Month"
          value={formatCurrency(kpis?.revenueThisMonth ?? 0)}
          change={kpis?.revenueChange}
          icon={DollarSign}
          colorClass="bg-success/10 text-success"
          sparklineData={[65, 72, 68, 80, 75, 88, 82, 95]}
          description="vs last month"
        />
        <StatCard
          title="Total Contacts"
          value={(kpis?.totalContacts ?? 0).toLocaleString()}
          icon={Users}
          colorClass="bg-chart-2/10 text-chart-2"
          sparklineData={[45, 52, 48, 58, 65, 70, 68, 75]}
        />
        <StatCard
          title="Active Conversations"
          value={(kpis?.activeConversations ?? 0).toLocaleString()}
          icon={MessageSquare}
          colorClass="bg-chart-3/10 text-chart-3"
          sparklineData={[30, 35, 38, 42, 40, 45, 48, 52]}
        />
        <StatCard
          title="Open Leads"
          value={(kpis?.openLeads ?? 0).toLocaleString()}
          icon={Lightbulb}
          colorClass="bg-chart-4/10 text-chart-4"
          sparklineData={[20, 25, 22, 28, 30, 35, 32, 38]}
        />
        <StatCard
          title="Conversion Rate"
          value={formatPercent(kpis?.conversionRate ?? 0)}
          icon={Target}
          colorClass="bg-primary/10 text-primary"
          sparklineData={[12, 15, 14, 18, 20, 22, 21, 24]}
          description="lead to customer"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        {/* Revenue Trend */}
        <Card className="xl:col-span-2 hover-lift border-2">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold">Revenue Trend</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 font-medium">Last 30 days performance</p>
              </div>
              {kpis?.revenueChange !== undefined && (
                <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-success/10 border border-success/20 self-start">
                  <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-success animate-pulse-subtle" />
                  <span className="text-xs font-semibold text-success">
                    {kpis.revenueChange > 0 ? '+' : ''}{formatPercent(Math.abs(kpis.revenueChange))}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data?.salesTrend ?? []} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="50%" stopColor="rgb(var(--chart-1))" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="rgb(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgb(var(--border))" 
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: 'rgb(var(--foreground))', opacity: 0.6 }} 
                  tickFormatter={(v: string) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'rgb(var(--foreground))', opacity: 0.6 }} 
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ 
                    background: 'rgb(var(--card))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: 12,
                    fontSize: 11,
                    boxShadow: 'var(--shadow-lg)',
                    backdropFilter: 'blur(12px)'
                  }}
                  formatter={(v: number) => [formatCurrency(v), 'Revenue']}
                  labelStyle={{ color: 'rgb(var(--foreground))', fontWeight: 600 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="rgb(var(--chart-1))"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={false}
                  activeDot={{ 
                    r: 4, 
                    fill: 'rgb(var(--chart-1))',
                    stroke: 'white',
                    strokeWidth: 2
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Growth */}
        <Card className="hover-lift border-2">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <div>
              <CardTitle className="text-base sm:text-lg font-semibold">Customer Growth</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 font-medium">New contacts per day</p>
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-2 sm:px-6">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={(data?.customerGrowth ?? []).slice(-14)} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--chart-2))" stopOpacity={1} />
                    <stop offset="100%" stopColor="rgb(var(--chart-2))" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="rgb(var(--border))" 
                  strokeOpacity={0.5}
                  vertical={false}
                />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 9, fill: 'rgb(var(--foreground))', opacity: 0.6 }} 
                  tickFormatter={(v: string) => v.slice(5)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 9, fill: 'rgb(var(--foreground))', opacity: 0.6 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgb(var(--card))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: 12,
                    fontSize: 11,
                    boxShadow: 'var(--shadow-lg)',
                    backdropFilter: 'blur(12px)'
                  }}
                  cursor={{ fill: 'rgb(var(--muted))', opacity: 0.1 }}
                />
                <Bar 
                  dataKey="newContacts" 
                  fill="url(#barGradient)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-3">
        {/* Team Performance */}
        <Card className="xl:col-span-2 hover-lift border-2">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg font-semibold">Team Performance</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 font-medium">Top performers this month</p>
              </div>
              <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors hidden sm:block">
                View All
              </button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 px-0 sm:px-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="pb-2 sm:pb-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider px-4 sm:px-0">Agent</th>
                    <th className="pb-2 sm:pb-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider px-2 sm:px-0">Convs.</th>
                    <th className="pb-2 sm:pb-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider px-2 sm:px-0">Deals</th>
                    <th className="pb-2 sm:pb-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Response</th>
                    <th className="pb-2 sm:pb-3 text-right font-semibold text-muted-foreground text-xs uppercase tracking-wider hidden xl:table-cell pr-4 sm:pr-0">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.teamPerformance ?? []).map((agent, i) => (
                    <tr 
                      key={agent.agentId} 
                      className="border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors group cursor-pointer"
                      style={{
                        animation: 'fade-in-up 0.3s ease-out',
                        animationDelay: `${i * 50}ms`,
                        animationFillMode: 'both'
                      }}
                    >
                      <td className="py-3 sm:py-4 px-4 sm:px-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar 
                            firstName={agent.name.split(' ')[0]} 
                            lastName={agent.name.split(' ')[1]} 
                            size="sm"
                            className="ring-2 ring-background group-hover:ring-primary/20 transition-all"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground group-hover:text-primary transition-colors text-xs sm:text-sm truncate">
                              {agent.name}
                            </p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Sales Agent</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 sm:py-4 text-right px-2 sm:px-0">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-chart-3/10 text-chart-3 font-semibold text-[10px] sm:text-xs">
                          {agent.conversations}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 text-right px-2 sm:px-0">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg bg-success/10 text-success font-bold text-xs sm:text-sm">
                          {agent.dealsWon}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 text-right text-muted-foreground hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-muted/50 text-xs">
                          {agent.avgResponseMins ? `${agent.avgResponseMins}m` : '—'}
                        </span>
                      </td>
                      <td className="py-3 sm:py-4 text-right hidden xl:table-cell pr-4 sm:pr-0">
                        <span className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-success/10 text-success text-[10px] sm:text-xs font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-subtle" />
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!data?.teamPerformance?.length && (
                    <tr>
                      <td colSpan={5} className="py-8 sm:py-12 text-center">
                        <div className="flex flex-col items-center">
                          <Users className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground/20 mb-2 sm:mb-3" />
                          <p className="text-xs sm:text-sm font-medium text-muted-foreground">No team data</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-1">Team performance will appear here</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Activity Feed + Upcoming Tasks */}
        <div className="space-y-4 sm:space-y-6">
          <Card className="hover-lift border-2">
            <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg font-semibold">Activity Feed</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 font-medium">Recent team activities</p>
                </div>
                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-success animate-pulse-subtle" />
              </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 sm:px-6">
              <ActivityFeed activities={data?.activityFeed ?? []} />
            </CardContent>
          </Card>

          <Card className="hover-lift border-2">
            <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
              <CardTitle className="text-base sm:text-lg font-semibold">Upcoming Tasks</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 font-medium">Your pending tasks</p>
            </CardHeader>
            <CardContent className="space-y-1.5 sm:space-y-2 px-4 sm:px-6">
              {(data?.upcomingTasks ?? []).slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors group cursor-pointer" style={{ backgroundColor: 'transparent' }}>
                  <div className={cn(
                    'h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full flex-shrink-0',
                    priorityColor[task.priority] ?? 'bg-muted-foreground'
                  )} />
                  <span className="text-xs sm:text-sm text-foreground truncate flex-1 group-hover:text-primary transition-colors">{task.title}</span>
                  {task.dueAt && (
                    <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-muted/50">
                      {formatDate(task.dueAt)}
                    </span>
                  )}
                </div>
              ))}
              {!data?.upcomingTasks?.length && (
                <div className="flex flex-col items-center justify-center py-6 sm:py-8">
                  <CheckCircle2 className="h-10 w-10 sm:h-12 sm:w-12 text-success/40 mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">All caught up!</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-1">No pending tasks</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Floating Quick Actions */}
      <QuickActions />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Hero skeleton */}
      <div className="rounded-2xl border border-border bg-muted/20 p-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-12 w-96" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-32 w-full max-w-md" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}><CardContent className="p-5 space-y-2"><Skeleton className="h-9 w-9 rounded-lg" /><Skeleton className="h-7 w-24" /><Skeleton className="h-3 w-32" /></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardContent className="p-6"><Skeleton className="h-52 w-full" /></CardContent></Card>
        <Card><CardContent className="p-6"><Skeleton className="h-52 w-full" /></CardContent></Card>
      </div>
    </div>
  );
}
