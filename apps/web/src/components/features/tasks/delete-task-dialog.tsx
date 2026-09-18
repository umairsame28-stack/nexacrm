'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDeleteTask, type Task } from '@/queries/tasks.queries';

export function DeleteTaskDialog({ task, onClose }: { task: Task; onClose: () => void }) {
  const deleteTask = useDeleteTask();

  const handleDelete = async () => {
    await deleteTask.mutateAsync(task.id);
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-background border border-border rounded-lg shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <div className="flex items-start gap-4 p-6">
          <div className="flex-shrink-0 rounded-full bg-destructive/15 p-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1 pt-1">
            <h2 id="delete-dialog-title" className="text-lg font-semibold text-foreground mb-2">
              Delete Task
            </h2>
            <p id="delete-dialog-description" className="text-sm text-muted-foreground mb-1">
              Are you sure you want to delete <strong className="font-semibold text-foreground">"{task.title}"</strong>?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-muted/30">
          <Button type="button" variant="outline" onClick={onClose} disabled={deleteTask.isPending}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteTask.isPending}
          >
            {deleteTask.isPending ? 'Deleting...' : 'Delete Task'}
          </Button>
        </div>
      </div>
    </>
  );
}
