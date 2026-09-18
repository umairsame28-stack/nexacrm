'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Trophy, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { useCreateDeal, useDealPipelines, usePipelineStages } from '@/queries/deals.queries';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  pipelineId: z.string().min(1, 'Required'),
  stageId: z.string().min(1, 'Required'),
  value: z.coerce.number().min(0),
  currency: z.string().default('USD'),
  probability: z.coerce.number().min(0).max(100).optional(),
  expectedCloseDate: z.string().optional(),
  assignedToId: z.string().optional(),
});
type Form = z.infer<typeof schema>;

interface Props {
  dealId: string | null;
  createOpen: boolean;
  onClose: () => void;
  onCloseCreate: () => void;
  onMarkWon: (id: string) => void;
  onMarkLost: (id: string, reason?: string) => void;
}

export function DealSheet({ dealId, createOpen, onClose, onCloseCreate, onMarkWon, onMarkLost }: Props) {
  const { data: pipelines } = useDealPipelines();
  const createDeal = useCreateDeal();
  const [lostReason, setLostReason] = useState('');
  const [showLostForm, setShowLostForm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { currency: 'USD', probability: 0, value: 0 },
  });

  const selectedPipelineId = watch('pipelineId');
  const { data: stages, isLoading: stagesLoading } = usePipelineStages(selectedPipelineId);
  const selectedPipeline = useMemo(() => pipelines?.find(p => p.id === selectedPipelineId), [pipelines, selectedPipelineId]);

  const open = !!dealId || createOpen;
  if (!open) return null;

  async function onSubmit(data: Form) {
    try {
      await createDeal.mutateAsync(data);
      reset();
      onCloseCreate();
    } catch (error) {
      // Error already shown by mutation
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={dealId ? onClose : onCloseCreate} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-background border-l border-border shadow-2xl animate-slide-in-right overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">{dealId ? 'Deal Detail' : 'New Deal'}</h2>
          <button onClick={dealId ? onClose : onCloseCreate} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {dealId ? (
          /* View mode: deal actions */
          <div className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">Deal ID: {dealId}</p>

            {showLostForm ? (
              <div className="space-y-3">
                <Label htmlFor="lost-reason">Reason for losing</Label>
                <Input id="lost-reason" value={lostReason} onChange={e => setLostReason(e.target.value)} placeholder="Budget constraints, competitor, etc." />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowLostForm(false)} className="flex-1">Cancel</Button>
                  <Button variant="destructive" size="sm" onClick={() => { onMarkLost(dealId, lostReason); onClose(); }} className="flex-1">Confirm Lost</Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button className="flex-1 bg-success hover:bg-success/90 text-white" onClick={() => { onMarkWon(dealId); onClose(); }}>
                  <Trophy className="h-4 w-4" /> Mark Won
                </Button>
                <Button variant="outline" className="flex-1 text-destructive hover:text-destructive" onClick={() => setShowLostForm(true)}>
                  <ThumbsDown className="h-4 w-4" /> Mark Lost
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Create mode */
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {createDeal.isError && (
              <Alert variant="destructive">
                Failed to create deal. Please try again.
              </Alert>
            )}

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...register('title')} placeholder="Acme Corp — Enterprise Plan" />
              {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div>
              <Label htmlFor="pipeline">Pipeline *</Label>
              <select id="pipeline" {...register('pipelineId')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select pipeline</option>
                {pipelines?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {errors.pipelineId && <p className="mt-1 text-xs text-destructive">{errors.pipelineId.message}</p>}
            </div>

            {selectedPipeline && (
              <div>
                <Label htmlFor="stage">Stage *</Label>
                <select id="stage" {...register('stageId')} disabled={stagesLoading} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
                  <option value="">{stagesLoading ? 'Loading stages...' : 'Select stage'}</option>
                  {stages?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                {errors.stageId && <p className="mt-1 text-xs text-destructive">{errors.stageId.message}</p>}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="value">Value</Label>
                <Input id="value" {...register('value')} type="number" min={0} step="0.01" placeholder="24000" />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <select id="currency" {...register('currency')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none">
                  {['USD', 'EUR', 'GBP', 'BRL', 'MXN'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="expectedCloseDate">Expected close date</Label>
              <Input id="expectedCloseDate" {...register('expectedCloseDate')} type="date" />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onCloseCreate} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Deal
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
