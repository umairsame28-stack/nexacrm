'use client';

import { useState } from 'react';
import { Plus, GripVertical, ChevronRight } from 'lucide-react';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLeadsKanban, usePipelines, useMoveLeadStage, type Lead } from '@/queries/leads.queries';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { LeadSheet } from '@/components/features/leads/lead-sheet';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

const scoreColor = (s: number) => s >= 80 ? 'bg-destructive/15 text-destructive' : s >= 50 ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground';

export default function LeadsPage() {
  const { data: pipelines } = usePipelines();
  const [activePipeline, setActivePipeline] = useState<string | undefined>(undefined);
  const { data: kanban, isLoading } = useLeadsKanban(activePipeline);
  const moveStage = useMoveLeadStage();
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [sheetLeadId, setSheetLeadId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragStart(e: DragStartEvent) { setActiveLeadId(String(e.active.id)); }

  function handleDragEnd(e: DragEndEvent) {
    setActiveLeadId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const overId = String(over.id);
    // over.id can be a stage container or another lead
    const stage = kanban?.stages.find(s => s.id === overId || s.leads.some(l => l.id === overId));
    if (stage && stage.id !== String(active.data.current?.stageId)) {
      moveStage.mutate({ id: String(active.id), stageId: stage.id });
    }
  }

  const activeLead = activeLeadId ? kanban?.stages.flatMap(s => s.leads).find(l => l.id === activeLeadId) : null;

  return (
    <div>
      <PageHeader
        title="Leads"
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add Lead
          </Button>
        }
      />

      {/* Pipeline tabs */}
      {pipelines && pipelines.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {pipelines.map(p => (
            <button
              key={p.id}
              onClick={() => setActivePipeline(p.id)}
              className={cn('rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                (activePipeline === p.id || (!activePipeline && p.isDefault))
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground')}
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <KanbanSkeleton />
      ) : !kanban?.stages.length ? (
        <EmptyState title="No pipeline configured" description="Create a pipeline first." />
      ) : (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide min-h-[calc(100vh-200px)]">
            {kanban.stages.map(stage => (
              <KanbanColumn
                key={stage.id}
                stage={stage}
                onCardClick={(id) => setSheetLeadId(id)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeLead && <LeadCard lead={activeLead} isDragging />}
          </DragOverlay>
        </DndContext>
      )}

      <LeadSheet
        leadId={sheetLeadId}
        createOpen={createOpen}
        onCloseCreate={() => setCreateOpen(false)}
        onClose={() => setSheetLeadId(null)}
      />
    </div>
  );
}

function KanbanColumn({ stage, onCardClick }: { stage: { id: string; name: string; color: string; leads: Lead[]; totalCount: number }; onCardClick: (id: string) => void }) {
  const { setNodeRef } = useSortable({ id: stage.id });
  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-72">
      <div className="mb-3 flex items-center gap-2 px-1">
        <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
        <span className="font-semibold text-sm text-foreground">{stage.name}</span>
        <span className="ml-auto text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{stage.totalCount}</span>
      </div>
      <SortableContext items={stage.leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2.5 min-h-16 rounded-xl bg-muted/30 p-2">
          {stage.leads.map(lead => (
            <SortableLeadCard key={lead.id} lead={lead} onCardClick={onCardClick} stageId={stage.id} />
          ))}
          {stage.leads.length === 0 && (
            <div className="flex items-center justify-center h-16 text-xs text-muted-foreground">Drop here</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableLeadCard({ lead, onCardClick, stageId }: { lead: Lead; onCardClick: (id: string) => void; stageId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
    data: { stageId },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && 'opacity-50')}
    >
      <LeadCard lead={lead} onClick={() => onCardClick(lead.id)} />
    </div>
  );
}

function LeadCard({ lead, onClick, isDragging }: { lead: Lead; onClick?: () => void; isDragging?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-lg bg-card border border-border p-3 cursor-pointer group hover:border-primary/50 hover:shadow-sm transition-all',
        isDragging && 'shadow-lg rotate-1 scale-105',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-medium text-sm text-foreground line-clamp-2 flex-1">{lead.title}</p>
        <span className={cn('text-[10px] font-bold rounded-full px-1.5 py-0.5 flex-shrink-0', scoreColor(lead.score))}>
          {lead.score}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Avatar firstName={lead.contact.firstName} lastName={lead.contact.lastName} src={lead.contact.avatarUrl} size="xs" />
        <span className="text-xs text-muted-foreground truncate">{lead.contact.firstName} {lead.contact.lastName ?? ''}</span>
      </div>
      {lead.followUpAt && (
        <div className="mt-2 text-xs text-muted-foreground">Follow-up {formatDate(lead.followUpAt)}</div>
      )}
      <div className="mt-2 flex items-center justify-between">
        {lead.assignedTo && (
          <Avatar firstName={lead.assignedTo.firstName} lastName={lead.assignedTo.lastName} size="xs" />
        )}
        <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 ml-auto transition-opacity" />
      </div>
    </div>
  );
}

function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-72">
          <Skeleton className="h-6 w-32 mb-3" />
          <div className="space-y-2.5 rounded-xl bg-muted/30 p-2">
            {Array.from({ length: 3 }).map((_, j) => <Skeleton key={j} className="h-24 w-full rounded-lg" />)}
          </div>
        </div>
      ))}
    </div>
  );
}
