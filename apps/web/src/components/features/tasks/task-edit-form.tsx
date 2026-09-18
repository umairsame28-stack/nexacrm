'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpdateTask, type Task } from '@/queries/tasks.queries';

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED']),
  dueAt: z.string().optional(),
  remindAt: z.string().optional(),
});

type Form = z.infer<typeof schema>;

export function TaskEditForm({ task, onClose }: { task: Task; onClose: () => void }) {
  const updateTask = useUpdateTask(task.id);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task.title,
      description: task.description ?? '',
      priority: task.priority,
      status: task.status,
      dueAt: task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 16) : '',
      remindAt: task.remindAt ? new Date(task.remindAt).toISOString().slice(0, 16) : '',
    },
  });

  async function onSubmit(data: Form) {
    await updateTask.mutateAsync({
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      status: data.status,
      dueAt: data.dueAt || null,
      remindAt: data.remindAt || null,
    });
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
        aria-labelledby="edit-task-title"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4 z-10">
          <h2 id="edit-task-title" className="text-lg font-semibold text-foreground">
            Edit Task
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
            <label htmlFor="edit-title" className="block text-sm font-medium text-foreground mb-1.5">
              Title *
            </label>
            <Input id="edit-title" {...register('title')} placeholder="Task title" />
            {errors.title && <p className="mt-1 text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-foreground mb-1.5">
              Description
            </label>
            <textarea
              id="edit-description"
              {...register('description')}
              rows={3}
              placeholder="Add details..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-priority" className="block text-sm font-medium text-foreground mb-1.5">
                Priority
              </label>
              <select
                id="edit-priority"
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
              <label htmlFor="edit-status" className="block text-sm font-medium text-foreground mb-1.5">
                Status
              </label>
              <select
                id="edit-status"
                {...register('status')}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="edit-due-date" className="block text-sm font-medium text-foreground mb-1.5">
              Due date
            </label>
            <Input id="edit-due-date" {...register('dueAt')} type="datetime-local" />
          </div>

          <div>
            <label htmlFor="edit-reminder" className="block text-sm font-medium text-foreground mb-1.5">
              Reminder
            </label>
            <Input id="edit-reminder" {...register('remindAt')} type="datetime-local" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || updateTask.isPending} className="flex-1">
              {(isSubmitting || updateTask.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
