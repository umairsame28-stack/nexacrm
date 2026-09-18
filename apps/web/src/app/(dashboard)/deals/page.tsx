'use client';

import { useState, useMemo } from 'react';
import { Plus, TrendingUp } from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  useDealsKanban, useDealPipelines, useMoveDealStage, useMarkDealWon, useMarkDealLost, type Deal,
} from '@/queries/deals.queries';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert } from '@/components/ui/alert';
import { DealSheet } from '@/components/features/deals/deal-sheet';
import { cn } from '@/lib/cn';
import { formatCurrency, formatDate } from '@/lib/format';
import Link from 'next/link';

export default function DealsPage() {
  const { data: pipelines } = useDealPipelines();
  const [activePipeline, setActivePipeline] = useState<string | undefined>(undefined);
  const { data: kanban, isLoading, isError, error } = useDealsKanban(activePipeline);
  const moveStage = useMoveDealStage();
  const markWon = useMarkDealWon();
  const markLost = useMarkDealLost();
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [sheetDealId, setSheetDealId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(e: DragEndEvent) {
    setActiveDealId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const stage = kanban?.stages.find(s => s.id === String(over.id) || s.deals.some(d => d.id === String(over.id)));
    if (stage) moveStage.mutate({ id: String(active.id), stageId: stage.id });
  }

  const activeDeal = activeDealId ? kanban?.stages.flatMap(s => s.deals).find(d => d.id === activeDealId) : null;

  const totalPipeline = useMemo(() => kanban?.stages.reduce((s, col) => s + col.totalValue, 0) ?? 0, [kanban]);
  const totalDeals = useMemo(() => kanban?.stages.reduce((s, col) => s + col.totalCount, 0) ?? 0, [kanban]);

  return (
    <div>
      <PageHeader
        title="Deals"
        description={`${totalDeals} open ${totalDeals === 1 ? 'deal' : 'deals'} · ${formatCurrency(totalPipeline)} pipeline`}
        actions={
          <>
            <Link href="/deals/forecast">
              <Button variant="outline" size="sm"><TrendingUp className="h-4 w-4" /> Forecast</Button>
            </Link>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Add Deal
            </Button>
          </>
        }
      />

      {/* Pipeline tabs */}
      {pipelines && pipelines.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {pipelines.map(p => (
            <button key={p.id} onClick={() => setActivePipeline(p.id)}
              className={cn('rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                (activePipeline === p.id || (!activePipeline && p.isDefault))
                  ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <Alert variant="destructive" className="mb-4">
          Failed to load deals. {error instanceof Error ? error.message : 'Please try again.'}
        </Alert>
      )}

      {isLoading ? (
        <div className="flex gap-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="flex-shrink-0 w-72 space-y-2"><Skeleton className="h-6 w-32" /><Skeleton className="h-64 w-full rounded-xl" /></div>)}</div>
      ) : !kanban?.stages.length ? (
        <EmptyState 
          title="No pipeline configured" 
          description="Set up a deal pipeline to start tracking deals." 
        />
      ) : (
        <DndContext sensors={sensors}
          onDragStart={(e: DragStartEvent) => setActiveDealId(String(e.active.id))}
          onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide min-h-[calc(100vh-220px)]">
            {kanban.stages.map(stage => (
              <DealColumn key={stage.id} stage={stage} onCardClick={setSheetDealId} />
            ))}
          </div>
          <DragOverlay>{activeDeal && <DealCard deal={activeDeal} isDragging />}</DragOverlay>
        </DndContext>
      )}

      <DealSheet
        dealId={sheetDealId}
        createOpen={createOpen}
        onClose={() => setSheetDealId(null)}
        onCloseCreate={() => setCreateOpen(false)}
        onMarkWon={(id) => markWon.mutate({ id })}
        onMarkLost={(id, reason) => markLost.mutate({ id, lostReason: reason })}
      />
    </div>
  );
}

function DealColumn({ stage, onCardClick }: {
  stage: { id: string; name: string; color: string; deals: Deal[]; totalValue: number; totalCount: number; probability: number };
  onCardClick: (id: string) => void;
}) {
  const { setNodeRef } = useSortable({ id: stage.id });
  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-72">
      <div className="mb-3 flex items-center gap-2 px-1">
        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
        <span className="font-semibold text-sm text-foreground">{stage.name}</span>
        <span className="ml-auto text-xs text-muted-foreground">{stage.probability}%</span>
      </div>
      <div className="mb-2 px-1">
        <p className="text-sm font-bold text-foreground">{formatCurrency(stage.totalValue)}</p>
        <p className="text-xs text-muted-foreground">{stage.totalCount} {stage.totalCount === 1 ? 'deal' : 'deals'}</p>
      </div>
      <SortableContext items={stage.deals.map(d => d.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5 min-h-16 rounded-xl bg-muted/30 p-2">
          {stage.deals.map(deal => (
            <SortableDealCard key={deal.id} deal={deal} stageId={stage.id} onCardClick={onCardClick} />
          ))}
          {stage.deals.length === 0 && (
            <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">Drop here</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableDealCard({ deal, stageId, onCardClick }: { deal: Deal; stageId: string; onCardClick: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id, data: { stageId } });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn(isDragging && 'opacity-50')} {...attributes} {...listeners}>
      <DealCard deal={deal} onClick={() => onCardClick(deal.id)} />
    </div>
  );
}

function DealCard({ deal, onClick, isDragging }: { deal: Deal; onClick?: () => void; isDragging?: boolean }) {
  const isOverdue = deal.expectedCloseDate && new Date(deal.expectedCloseDate) < new Date() && deal.status === 'OPEN';
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'w-full text-left rounded-lg bg-card border border-border p-3',
        'cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        isDragging && 'shadow-lg rotate-1 scale-105'
      )}
    >
      <p className="font-medium text-sm text-foreground line-clamp-2 mb-1.5">{deal.title}</p>
      <p className="text-base font-bold text-primary">{formatCurrency(Number(deal.value), deal.currency)}</p>
      {deal.contacts[0]?.contact && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Avatar firstName={deal.contacts[0].contact.firstName} size="xs" />
          {deal.contacts[0].contact.firstName} {deal.contacts[0].contact.lastName ?? ''}
        </div>
      )}
      {deal.expectedCloseDate && (
        <p className={cn('mt-1.5 text-xs', isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
          Close: {formatDate(deal.expectedCloseDate)}
          {isOverdue && ' ⚠️'}
        </p>
      )}
      {deal.assignedTo && (
        <div className="mt-2 flex justify-end">
          <Avatar firstName={deal.assignedTo.firstName} size="xs" />
        </div>
      )}
    </button>
  );
}
