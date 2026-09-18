'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateTask } from '@/queries/tasks.queries';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS']).default('TODO'),
  dueAt: z.string().optional(),
  remindAt: z.string().optional(),
  assignedToId: z.string().optional(),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export function TaskForm({ onClose }: { onClose: () => void }) {
  const createTask = useCreateTask();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'MEDIUM', status: 'TODO' },
  });

  async function onSubmit(data: Form) {
    await createTask.mutateAsync(data);
    onClose();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l border-border shadow-2xl animate-slide-in-right overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-task-title"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4 z-10">
          <h2 id="new-task-title" className="text-lg font-semibold text-foreground">
            New Task
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-foreground mb-1.5">
              Title *
            </label>
            <Input
              id="task-title"
              {...register('title')}
              placeholder="Follow up call with Maria"
            />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="task-description" className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <textarea
              id="task-description"
              {...register('description')}
              rows={3}
              placeholder="Add details..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="task-priority" className="block text-sm font-medium text-foreground mb-1.5">
                Priority
              </label>
              <select
                id="task-priority"
                {...register('priority')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="task-status" className="block text-sm font-medium text-foreground mb-1.5">
                Status
              </label>
              <select
                id="task-status"
                {...register('status')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="task-due-date" className="block text-sm font-medium text-foreground mb-1.5">
              Due date
            </label>
            <Input id="task-due-date" {...register('dueAt')} type="datetime-local" />
          </div>

          <div>
            <label htmlFor="task-reminder" className="block text-sm font-medium text-foreground mb-1.5">
              Reminder
            </label>
            <Input id="task-reminder" {...register('remindAt')} type="datetime-local" />
          </div>

          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-3">
              Optional: Link to CRM records (use IDs from Contacts/Deals pages)
            </p>
            <div className="space-y-3">
              <div>
                <label htmlFor="task-assignee" className="block text-xs font-medium text-foreground mb-1">
                  Assign to (User ID)
                </label>
                <Input
                  id="task-assignee"
                  {...register('assignedToId')}
                  placeholder="User UUID"
                  className="text-sm"
                />
              </div>
              <div>
                <label htmlFor="task-contact" className="block text-xs font-medium text-foreground mb-1">
                  Related Contact (ID)
                </label>
                <Input
                  id="task-contact"
                  {...register('contactId')}
                  placeholder="Contact UUID"
                  className="text-sm"
                />
              </div>
              <div>
                <label htmlFor="task-deal" className="block text-xs font-medium text-foreground mb-1">
                  Related Deal (ID)
                </label>
                <Input
                  id="task-deal"
                  {...register('dealId')}
                  placeholder="Deal UUID"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || createTask.isPending} className="flex-1">
              {(isSubmitting || createTask.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
