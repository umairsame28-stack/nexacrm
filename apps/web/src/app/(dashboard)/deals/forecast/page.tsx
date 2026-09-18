'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDealForecast } from '@/queries/deals.queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PageHeader } from '@/components/layout/page-header';
import { formatCurrency } from '@/lib/format';

export default function ForecastPage() {
  const router = useRouter();
  const { data: pipelines, isLoading, isError, error } = useDealForecast();

  return (
    <div>
      <div className="mb-4">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Deals
        </button>
      </div>

      <PageHeader title="Revenue Forecast" description="Weighted forecast by pipeline stage" />

      {isError && (
        <Alert variant="destructive" className="mb-4">
          Failed to load forecast data. {error instanceof Error ? error.message : 'Please try again.'}
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      ) : !pipelines?.length ? (
        <EmptyState 
          title="No forecast data available" 
          description="Create some deals to see revenue forecasting." 
        />
      ) : (
        <div className="space-y-8">
          {pipelines.map(pipeline => {
            const chartData = pipeline.stages.map(s => ({
              name: s.name,
              Pipeline: s.totalValue,
              Weighted: s.weightedValue,
              Deals: s.dealCount,
            }));
            return (
              <div key={pipeline.pipeline}>
                <h2 className="text-lg font-semibold text-foreground mb-4">{pipeline.pipeline}</h2>

                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Total Pipeline</p>
                      <p className="text-xl font-bold text-foreground">{formatCurrency(pipeline.totalPipelineValue, pipeline.currency)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Weighted Forecast</p>
                      <p className="text-xl font-bold text-primary">{formatCurrency(pipeline.totalWeightedValue, pipeline.currency)}</p>
                    </CardContent>
                  </Card>
                  <Card className="col-span-2 sm:col-span-1">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-1">Forecast Accuracy</p>
                      <p className="text-xl font-bold text-foreground">
                        {pipeline.totalPipelineValue > 0
                          ? `${Math.round((pipeline.totalWeightedValue / pipeline.totalPipelineValue) * 100)}%`
                          : '—'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Bar chart */}
                <Card>
                  <CardHeader><CardTitle>Stage Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--muted-foreground))' }} tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ background: 'rgb(var(--card))', border: '1px solid rgb(var(--border))', borderRadius: 8, fontSize: 12 }}
                          formatter={(v: number) => [formatCurrency(v, pipeline.currency)]}
                        />
                        <Legend />
                        <Bar dataKey="Pipeline" fill="rgb(var(--muted))" radius={[3,3,0,0]} />
                        <Bar dataKey="Weighted" fill="rgb(var(--primary))" radius={[3,3,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Stage table */}
                <Card className="mt-4">
                  <CardContent className="p-0">
                    <div className="rounded-xl overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Stage</TableHead>
                            <TableHead className="text-right">Deals</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                            <TableHead className="text-right">Probability</TableHead>
                            <TableHead className="text-right">Weighted</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pipeline.stages.map(stage => (
                            <TableRow key={stage.name}>
                              <TableCell className="font-medium">{stage.name}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{stage.dealCount}</TableCell>
                              <TableCell className="text-right">{formatCurrency(stage.totalValue, pipeline.currency)}</TableCell>
                              <TableCell className="text-right text-muted-foreground">{stage.probability}%</TableCell>
                              <TableCell className="text-right font-semibold text-primary">{formatCurrency(stage.weightedValue, pipeline.currency)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/30 font-bold">
                            <TableCell className="font-bold">Total</TableCell>
                            <TableCell className="text-right">{pipeline.stages.reduce((s,st)=>s+st.dealCount,0)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(pipeline.totalPipelineValue, pipeline.currency)}</TableCell>
                            <TableCell />
                            <TableCell className="text-right text-primary">{formatCurrency(pipeline.totalWeightedValue, pipeline.currency)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
