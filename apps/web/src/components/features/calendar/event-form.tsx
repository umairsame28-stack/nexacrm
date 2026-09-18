'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateEvent, useUpdateEvent, type CalendarEvent } from '@/queries/calendar.queries';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  startAt: z.string().min(1, 'Required'),
  endAt: z.string().min(1, 'Required'),
  location: z.string().optional(),
  color: z.string().optional(),
  allDay: z.boolean().default(false),
}).refine((data) => {
  const start = new Date(data.startAt);
  const end = new Date(data.endAt);
  return end >= start;
}, {
  message: 'End time must be after start time',
  path: ['endAt'],
});
type Form = z.infer<typeof schema>;

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// Chart token mapping for event colors - Premium Indigo/Violet Palette
const CHART_COLORS = [
  'rgb(99 102 241)',    // chart-1: Primary Indigo
  'rgb(139 92 246)',    // chart-2: Accent Violet
  'rgb(59 130 246)',    // chart-3: Info Blue
  'rgb(16 185 129)',    // chart-4: Success Green  
  'rgb(245 158 11)',    // chart-5: Warning Amber
  'rgb(239 68 68)',     // chart-6: Danger Red
];

export function EventForm({ 
  onClose, 
  defaultDate,
  event 
}: { 
  onClose: () => void; 
  defaultDate?: Date;
  event?: CalendarEvent;
}) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent(event?.id ?? '');
  
  const isEditMode = !!event;
  const defaultStart = event ? parseISO(event.startAt) : (defaultDate ?? new Date());
  const defaultEnd = event ? parseISO(event.endAt) : new Date(defaultStart.getTime() + 60 * 60 * 1000);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: event?.title ?? '',
      description: event?.description ?? '',
      startAt: format(defaultStart, "yyyy-MM-dd'T'HH:mm"),
      endAt: format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
      location: event?.location ?? '',
      color: event?.color ?? CHART_COLORS[0],
      allDay: event?.allDay ?? false,
    },
  });

  const selectedColor = watch('color');
  const allDay = watch('allDay');

  async function onSubmit(data: Form) {
    const payload = { 
      ...data, 
      startAt: new Date(data.startAt).toISOString(), 
      endAt: new Date(data.endAt).toISOString() 
    };
    
    if (isEditMode) {
      await updateEvent.mutateAsync(payload);
    } else {
      await createEvent.mutateAsync(payload);
    }
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-form-title"
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l border-border shadow-2xl animate-slide-in-right overflow-y-auto"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <h2 id="event-form-title" className="text-lg font-semibold text-foreground">
            {isEditMode ? 'Edit Event' : 'New Event'}
          </h2>
          <button 
            onClick={onClose} 
            aria-label="Close dialog"
            className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <Input 
              {...register('title')} 
              placeholder="Product Demo — Acme Corp"
              className="text-base"
            />
            {errors.title && <p className="mt-1.5 text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Event Color</label>
            <div className="flex gap-2.5">
              {CHART_COLORS.map((c, idx) => (
                <button 
                  key={c} 
                  type="button" 
                  onClick={() => setValue('color', c)}
                  aria-label={`Select color ${idx + 1}`}
                  className={cn_local(
                    'h-8 w-8 rounded-full border-2 transition-all hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2', 
                    selectedColor === c ? 'border-foreground scale-110 shadow-md' : 'border-border'
                  )}
                  style={{ backgroundColor: c }} 
                />
              ))}
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2.5 text-sm font-medium text-foreground cursor-pointer group">
              <input 
                type="checkbox" 
                {...register('allDay')} 
                className="h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-0 cursor-pointer"
              />
              <span className="group-hover:text-foreground/80 transition-colors">All-day event</span>
            </label>
            <p className="mt-1.5 text-xs text-muted-foreground ml-6">
              Event spans entire day without specific times
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Start <span className="text-destructive">*</span>
              </label>
              <Input {...register('startAt')} type={allDay ? 'date' : 'datetime-local'} />
              {errors.startAt && <p className="mt-1.5 text-xs text-destructive">{errors.startAt.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                End <span className="text-destructive">*</span>
              </label>
              <Input {...register('endAt')} type={allDay ? 'date' : 'datetime-local'} />
              {errors.endAt && <p className="mt-1.5 text-xs text-destructive">{errors.endAt.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Location</label>
            <Input 
              {...register('location')} 
              placeholder="Zoom, Google Meet, or address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Description</label>
            <textarea 
              {...register('description')} 
              rows={4} 
              placeholder="Meeting agenda, notes, or additional details…"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-colors" 
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} 
              {isEditMode ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

function cn_local(...c: (string | boolean | undefined)[]) { return c.filter(Boolean).join(' '); }
