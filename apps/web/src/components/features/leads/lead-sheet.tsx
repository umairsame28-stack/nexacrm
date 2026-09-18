'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLead, useCreateLead, useUpdateLead, usePipelines } from '@/queries/leads.queries';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  contactId: z.string().min(1, 'Required'),
  pipelineId: z.string().min(1, 'Required'),
  stageId: z.string().min(1, 'Required'),
  score: z.coerce.number().min(0).max(100).optional(),
  assignedToId: z.string().optional(),
  followUpAt: z.string().optional(),
  followUpNote: z.string().optional(),
});
type Form = z.infer<typeof schema>;

interface Props {
  leadId: string | null;
  createOpen: boolean;
  onClose: () => void;
  onCloseCreate: () => void;
}

const selectClass =
  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50';

export function LeadSheet({ leadId, createOpen, onClose, onCloseCreate }: Props) {
  const isViewOpen = !!leadId;
  const { data: lead } = useLead(leadId ?? '');
  const { data: pipelines, isLoading: pipelinesLoading, isError: pipelinesError } = usePipelines();
  const createLead = useCreateLead();
  const updateLead = useUpdateLead(leadId ?? '');

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      contactId: '',
      pipelineId: '',
      stageId: '',
      score: undefined,
      assignedToId: '',
      followUpAt: '',
      followUpNote: '',
    },
  });

  // When editing: populate form from lead data once loaded
  useEffect(() => {
    if (leadId && lead) {
      setValue('title', lead.title);
      setValue('pipelineId', lead.pipelineId);
      setValue('stageId', lead.stageId);
      setValue('score', lead.score);
      setValue('assignedToId', lead.assignedToId ?? '');
    }
  }, [leadId, lead, setValue]);

  // When creating: auto-select the default pipeline once pipelines load
  useEffect(() => {
    if (!leadId && pipelines && pipelines.length > 0) {
      const current = watch('pipelineId');
      if (!current) {
        const defaultPipeline = pipelines.find(p => p.isDefault) ?? pipelines[0];
        setValue('pipelineId', defaultPipeline.id);
        // Auto-select first stage of default pipeline
        if (defaultPipeline.stages.length > 0) {
          setValue('stageId', defaultPipeline.stages[0].id);
        }
      }
    }
  }, [pipelines, leadId, setValue, watch]);

  const watchedPipelineId = watch('pipelineId');
  const selectedPipeline = pipelines?.find(p => p.id === watchedPipelineId);

  // When pipeline changes, reset stageId and auto-select first stage
  const handlePipelineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    setValue('pipelineId', pid, { shouldValidate: true });
    const pipeline = pipelines?.find(p => p.id === pid);
    if (pipeline && pipeline.stages.length > 0) {
      setValue('stageId', pipeline.stages[0].id, { shouldValidate: true });
    } else {
      setValue('stageId', '', { shouldValidate: true });
    }
  };

  async function onSubmit(data: Form) {
    if (leadId) {
      await updateLead.mutateAsync(data);
      onClose();
    } else {
      await createLead.mutateAsync(data);
      onCloseCreate();
    }
  }

  const open = isViewOpen || createOpen;
  if (!open) return null;

  const title = leadId ? (lead?.title ?? 'Lead') : 'New Lead';

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={leadId ? onClose : onCloseCreate}
      />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg bg-background border-l border-border shadow-2xl animate-slide-in-right overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            onClick={leadId ? onClose : onCloseCreate}
            className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
            <Input {...register('title')} placeholder="Enterprise Demo Request" />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Contact ID *</label>
            <Input {...register('contactId')} placeholder="Paste contact UUID here" />
            {errors.contactId && (
              <p className="mt-1 text-xs text-destructive">{errors.contactId.message}</p>
            )}
          </div>

          {/* Pipeline */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Pipeline *</label>

            {pipelinesError ? (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                Failed to load pipelines. Check your connection.
              </div>
            ) : pipelinesLoading ? (
              <div className={`${selectClass} flex items-center gap-2 text-muted-foreground`}>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading pipelines…
              </div>
            ) : !pipelines || pipelines.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                No pipelines found. Create one in Settings first.
              </div>
            ) : (
              <select
                value={watchedPipelineId}
                onChange={handlePipelineChange}
                className={selectClass}
              >
                <option value="">Select pipeline</option>
                {pipelines.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
            {errors.pipelineId && (
              <p className="mt-1 text-xs text-destructive">{errors.pipelineId.message}</p>
            )}
          </div>

          {/* Stage — shown only when a pipeline with stages is selected */}
          {selectedPipeline && selectedPipeline.stages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Stage *</label>
              <select {...register('stageId')} className={selectClass}>
                <option value="">Select stage</option>
                {selectedPipeline.stages.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.stageId && (
                <p className="mt-1 text-xs text-destructive">{errors.stageId.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Score (0–100)</label>
            <Input {...register('score')} type="number" min={0} max={100} placeholder="75" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Follow-up date</label>
            <Input {...register('followUpAt')} type="datetime-local" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Follow-up note</label>
            <Input {...register('followUpNote')} placeholder="Call about pricing…" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={leadId ? onClose : onCloseCreate}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || pipelinesLoading || !pipelines?.length}
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {leadId ? 'Save' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
