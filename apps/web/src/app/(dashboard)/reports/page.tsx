'use client';

import { useState } from 'react';
import { Download, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { format, subDays } from 'date-fns';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  useSalesReport, useRevenueReport, useAgentPerformance,
  usePipelineReport, useWhatsAppReport, useExportReport,
} from '@/queries/reports.queries';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency, formatPercent, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';

type Tab = 'sales' | 'revenue' | 'agents' | 'pipeline' | 'whatsapp';
const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'sales', label: 'Sales' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'agents', label: 'Agent Performance' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'whatsapp', label: 'WhatsApp' },
];

// Chart colors using Phase 2A tokens (RGB format)
const CHART_COLORS = {
  primary: 'rgb(91 92 226)',       // --chart-1: Primary Indigo
  accent: 'rgb(124 92 252)',       // --chart-2: Accent Violet
  success: 'rgb(16 185 129)',      // --chart-3: Success Green
  info: 'rgb(59 130 246)',         // --chart-4: Info Blue
  warning: 'rgb(245 158 11)',      // --chart-5: Warning Amber
  danger: 'rgb(239 68 68)',        // --chart-6: Danger Red
} as const;

// Tooltip style using RGB tokens (Phase 2A compliant)
const tooltipStyle = {
  backgroundColor: 'rgb(var(--card))',
  border: '1px solid rgb(var(--border))',
  borderRadius: 8,
  fontSize: 12,
  color: 'rgb(var(--foreground))',
};

// Map stage colors from DB to chart tokens
function getStageColor(dbColor: string, index: number): string {
  // Map database hex colors to chart tokens for consistency
  const colorMap: Record<string, string> = {
    '#6366f1': CHART_COLORS.primary,   // Indigo → primary
    '#8b5cf6': CHART_COLORS.accent,    // Purple → accent
    '#10b981': CHART_COLORS.success,   // Green → success
    '#3b82f6': CHART_COLORS.info,      // Blue → info
    '#f59e0b': CHART_COLORS.warning,   // Amber → warning
    '#ef4444': CHART_COLORS.danger,    // Red → danger
  };
  
  // Return mapped color or cycle through chart colors
  return colorMap[dbColor.toLowerCase()] || Object.values(CHART_COLORS)[index % 6];
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('sales');
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const filter = { from, to };
  const exportReport = useExportReport();

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Track sales performance, revenue trends, and team metrics"
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={exportReport.isPending}
            onClick={() => exportReport.mutate({ report: activeTab, from, to })}
            aria-label="Export current report as CSV"
          >
            <Download className="h-4 w-4" />
            {exportReport.isPending ? 'Exporting…' : 'Export CSV'}
          </Button>
        }
      />

      {/* Date range */}
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <label htmlFor="date-from" className="text-sm font-medium text-foreground">
            From
          </label>
          <input
            id="date-from"
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            aria-label="Start date for report period"
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="date-to" className="text-sm font-medium text-foreground">
            To
          </label>
          <input
            id="date-to"
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            aria-label="End date for report period"
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          />
        </div>
        <div className="h-6 w-px bg-border" />
        {[7, 30, 90].map(d => (
          <button
            key={d}
            onClick={() => {
              setFrom(format(subDays(new Date(), d), 'yyyy-MM-dd'));
              setTo(format(new Date(), 'yyyy-MM-dd'));
            }}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/50 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Last {d}d
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-border overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none',
              activeTab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            )}
            role="tab"
            aria-selected={activeTab === t.id}
            aria-label={`View ${t.label} report`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={`${TABS.find(t => t.id === activeTab)?.label} report`}>
        {activeTab === 'sales' && <SalesTab filter={filter} />}
        {activeTab === 'revenue' && <RevenueTab filter={filter} />}
        {activeTab === 'agents' && <AgentsTab filter={filter} />}
        {activeTab === 'pipeline' && <PipelineTab />}
        {activeTab === 'whatsapp' && <WhatsAppTab filter={filter} />}
      </div>
    </div>
  );
}

// ─── Sales Tab ────────────────────────────────────────────────────────────────
function SalesTab({ filter }: { filter: { from: string; to: string } }) {
  const { data, isLoading, isError, error, refetch } = useSalesReport(filter);

  if (isLoading) return <ReportSkeleton />;
  
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load sales report. {error?.message || 'Please try again.'}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || (!data.wonDeals && !data.lostDeals && !data.totalRevenue)) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No Sales Data</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            No closed deals found for the selected period. Try adjusting your date range.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Won Deals', value: String(data.wonDeals), color: 'text-success' },
          { label: 'Lost Deals', value: String(data.lostDeals), color: 'text-destructive' },
          { label: 'Total Revenue', value: formatCurrency(data.totalRevenue), color: 'text-foreground' },
          { label: 'Win Rate', value: formatPercent(data.winRate), color: 'text-primary' },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">{k.label}</p>
              <p className={cn('text-2xl font-bold', k.color)}>{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {data.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data.trend}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={CHART_COLORS.primary}
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
              No trend data available for this period
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance by Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-3 text-left font-medium text-muted-foreground">Agent</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Won</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Lost</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Revenue</th>
                  <th className="pb-3 text-right font-medium text-muted-foreground">Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.byAgent.map(a => (
                  <tr key={a.agentId} className="border-b border-border/50 last:border-0">
                    <td className="py-3 font-medium text-foreground">{a.name}</td>
                    <td className="py-3 text-right text-success font-semibold">{a.won}</td>
                    <td className="py-3 text-right text-destructive">{a.lost}</td>
                    <td className="py-3 text-right text-foreground">{formatCurrency(a.revenue)}</td>
                    <td className="py-3 text-right text-muted-foreground">
                      {a.won + a.lost > 0 ? formatPercent(Math.round((a.won / (a.won + a.lost)) * 100)) : '—'}
                    </td>
                  </tr>
                ))}
                {!data.byAgent.length && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No agent data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Revenue Tab ──────────────────────────────────────────────────────────────
function RevenueTab({ filter }: { filter: { from: string; to: string } }) {
  const { data, isLoading, isError, error, refetch } = useRevenueReport(filter);

  if (isLoading) return <ReportSkeleton />;
  
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load revenue report. {error?.message || 'Please try again.'}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || (!data.totalActual && !data.totalForecast)) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No Revenue Data</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            No revenue data found for the selected period. Try adjusting your date range.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Total Actual</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(data.totalActual)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Total Forecast</p>
            <p className="text-2xl font-bold text-primary">{formatCurrency(data.totalForecast)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">MoM Growth</p>
            <p className={cn('text-2xl font-bold', data.momGrowth >= 0 ? 'text-success' : 'text-destructive')}>
              {data.momGrowth > 0 ? '+' : ''}{formatPercent(data.momGrowth)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue vs Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          {data.monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }}
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatCurrency(v)]} />
                <Legend />
                <Bar dataKey="actual" fill={CHART_COLORS.primary} name="Actual" radius={[4, 4, 0, 0]} />
                <Bar dataKey="forecast" fill="rgb(var(--muted))" name="Forecast" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-80 text-sm text-muted-foreground">
              No monthly data available for this period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Agents Tab ───────────────────────────────────────────────────────────────
function AgentsTab({ filter }: { filter: { from: string; to: string } }) {
  const { data, isLoading, isError, error, refetch } = useAgentPerformance(filter);

  if (isLoading) return <ReportSkeleton />;
  
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load agent performance. {error?.message || 'Please try again.'}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || !data.data.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No Agent Data</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            No agent performance data found for the selected period.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Performance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 font-medium text-muted-foreground text-left">Agent</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-left hidden sm:table-cell">
                  Conversations
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-left hidden sm:table-cell">
                  Deals Won
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-left hidden md:table-cell">
                  Revenue
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-left hidden lg:table-cell">
                  Tasks Done
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-left hidden xl:table-cell">
                  Avg Response
                </th>
              </tr>
            </thead>
            <tbody>
              {data.data.map(a => (
                <tr key={a.agentId} className="border-b border-border/50 last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar firstName={a.name.split(' ')[0]} lastName={a.name.split(' ')[1]} size="xs" />
                      <span className="font-medium text-foreground">{a.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {a.conversationsHandled}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground hidden sm:table-cell">
                    {a.dealsWon}
                  </td>
                  <td className="px-4 py-3 text-foreground hidden md:table-cell">
                    {formatCurrency(a.revenueGenerated)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                    {a.tasksCompleted}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                    {a.avgResponseTimeMinutes != null ? `${a.avgResponseTimeMinutes}m` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Pipeline Tab ─────────────────────────────────────────────────────────────
function PipelineTab() {
  const { data, isLoading, isError, error, refetch } = usePipelineReport();

  if (isLoading) return <ReportSkeleton />;
  
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load pipeline report. {error?.message || 'Please try again.'}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || !data.pipelines.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No Pipeline Data</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            No pipeline data available. Create a pipeline to start tracking deals.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {data.pipelines.map(p => (
        <div key={p.pipelineId}>
          <h3 className="text-lg font-semibold text-foreground mb-4">{p.pipelineName}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Total Pipeline</p>
                <p className="text-xl font-bold text-foreground">
                  {formatCurrency(p.totalPipelineValue, p.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Weighted Value</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(p.totalWeightedValue, p.currency)}
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stage</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Deals</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground">Value</th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">
                        Probability
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                        Weighted
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden lg:table-cell">
                        Avg Days
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden xl:table-cell">
                        Conversion
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.stages.map((s, idx) => (
                      <tr key={s.stageId} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: getStageColor(s.color, idx) }}
                            />
                            <span className="font-medium text-foreground">{s.stageName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{s.dealCount}</td>
                        <td className="px-4 py-3 text-foreground">
                          {formatCurrency(s.totalValue, p.currency)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {s.probability}%
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary hidden md:table-cell">
                          {formatCurrency(s.weightedValue, p.currency)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                          {s.avgTimeInStageDays != null ? `${s.avgTimeInStageDays}d` : '—'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell">
                          {s.conversionRateToNext != null ? `${s.conversionRateToNext}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

// ─── WhatsApp Tab ─────────────────────────────────────────────────────────────
function WhatsAppTab({ filter }: { filter: { from: string; to: string } }) {
  const { data, isLoading, isError, error, refetch } = useWhatsAppReport(filter);

  if (isLoading) return <ReportSkeleton />;
  
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Failed to load WhatsApp analytics. {error?.message || 'Please try again.'}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data || (!data.messagesSent && !data.messagesReceived)) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <AlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">No WhatsApp Data</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            No WhatsApp message data found for the selected period.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Messages Sent', value: formatNumber(data.messagesSent) },
          { label: 'Messages Received', value: formatNumber(data.messagesReceived) },
          {
            label: 'Avg Response',
            value: data.avgFirstResponseMinutes != null ? `${data.avgFirstResponseMinutes}m` : '—',
          },
          {
            label: 'P95 Response',
            value: data.p95FirstResponseMinutes != null ? `${data.p95FirstResponseMinutes}m` : '—',
          },
        ].map(k => (
          <Card key={k.label}>
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">{k.label}</p>
              <p className="text-2xl font-bold text-foreground">{k.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Message Volume</CardTitle>
        </CardHeader>
        <CardContent>
          {data.dailyVolume.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.dailyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="sent" fill={CHART_COLORS.primary} name="Sent" radius={[4, 4, 0, 0]} />
                <Bar dataKey="received" fill={CHART_COLORS.success} name="Received" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-sm text-muted-foreground">
              No daily volume data available
            </div>
          )}
        </CardContent>
      </Card>

      {data.templatesUsed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Template Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">Template</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Sent</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Delivered</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Read</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Read Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.templatesUsed.map((t, i) => (
                    <tr key={i} className="border-b border-border/50 last:border-0">
                      <td className="py-3 font-medium text-foreground">{t.templateName ?? '—'}</td>
                      <td className="py-3 text-muted-foreground">{t.sent}</td>
                      <td className="py-3 text-muted-foreground">{t.delivered}</td>
                      <td className="py-3 text-muted-foreground">{t.read}</td>
                      <td className="py-3 text-foreground font-medium">
                        {t.sent > 0 ? formatPercent(Math.round((t.read / t.sent) * 100)) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function ReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
