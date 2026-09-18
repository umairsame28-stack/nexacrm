'use client';

import { useState } from 'react';
import { Plus, Search, Filter, CheckSquare, Clock, AlertCircle, RefreshCw, User, MoreVertical, Edit2, Trash2, Check } from 'lucide-react';
import { useTasksKanban, useCompleteTask, useDeleteTask, type Task } from '@/queries/tasks.queries';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TaskForm } from '@/components/features/tasks/task-form';
import { TaskEditForm } from '@/components/features/tasks/task-edit-form';
import { DeleteTaskDialog } from '@/components/features/tasks/delete-task-dialog';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: 'bg-destructive/15 text-destructive border-destructive/30',
  HIGH: 'bg-warning/15 text-warning border-warning/30',
  MEDIUM: 'bg-primary/10 text-primary border-primary/20',
  LOW: 'bg-muted text-muted-foreground border-border',
};

const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

function TaskCard({ task, onEdit, onDelete }: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const completeTask = useCompleteTask();
  const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && task.status !== 'DONE';
  const [menuOpen, setMenuOpen] = useState(false);

  const handleComplete = () => {
    if (task.status !== 'DONE') {
      completeTask.mutate(task.id);
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg bg-card border border-border p-4 hover:border-primary/40 hover:shadow-sm transition-all group relative',
        task.status === 'DONE' && 'opacity-60'
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <button
          onClick={handleComplete}
          disabled={task.status === 'DONE' || completeTask.isPending}
          className={cn(
            'mt-0.5 h-5 w-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            task.status === 'DONE'
              ? 'bg-success border-success text-white cursor-not-allowed'
              : 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer'
          )}
          aria-label={task.status === 'DONE' ? 'Task completed' : 'Mark task as complete'}
          aria-pressed={task.status === 'DONE'}
        >
          {task.status === 'DONE' && <Check className="h-3 w-3" />}
        </button>

        <div className="flex-1 min-w-0">
          <h3
            className={cn(
              'text-sm font-semibold text-foreground mb-1',
              task.status === 'DONE' && 'line-through text-muted-foreground'
            )}
          >
            {task.title}
          </h3>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn('text-[10px] font-semibold', PRIORITY_COLORS[task.priority])}
            >
              {task.priority}
            </Badge>

            {task.dueAt && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    isOverdue ? 'text-destructive' : 'text-muted-foreground'
                  )}
                >
                  {isOverdue && '⚠ '}
                  {formatDate(task.dueAt)}
                </span>
              </div>
            )}

            {task.assignedTo && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  {task.assignedTo.firstName} {task.assignedTo.lastName}
                </span>
              </div>
            )}

            {task.contact && (
              <span className="text-[10px] text-muted-foreground truncate max-w-32">
                📞 {task.contact.firstName} {task.contact.lastName ?? ''}
              </span>
            )}

            {task.deal && (
              <span className="text-[10px] text-muted-foreground truncate max-w-32">
                💼 {task.deal.title}
              </span>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Task actions"
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(task);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(task);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskColumn({ status, tasks, onEdit, onDelete }: {
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 px-1">
        <h2 className="font-semibold text-sm text-foreground">{STATUS_LABELS[status]}</h2>
        <Badge variant="secondary" className="text-xs">
          {tasks.length}
        </Badge>
      </div>
      <div className="space-y-3 min-h-32 rounded-xl bg-muted/30 p-3">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-24 text-center">
            <CheckSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">No tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: kanban, isLoading, isError, error, refetch } = useTasksKanban('me');

  // Filter tasks by search query
  const filteredKanban = kanban
    ? {
        columns: kanban.columns.map((col) => ({
          ...col,
          tasks: col.tasks.filter((task) => {
            if (!searchQuery) return true;
            const query = searchQuery.toLowerCase();
            return (
              task.title.toLowerCase().includes(query) ||
              task.description?.toLowerCase().includes(query) ||
              task.contact?.firstName.toLowerCase().includes(query) ||
              task.contact?.lastName?.toLowerCase().includes(query) ||
              task.deal?.title.toLowerCase().includes(query)
            );
          }),
        })),
      }
    : null;

  const totalTasks = filteredKanban?.columns.reduce((sum, col) => sum + col.tasks.length, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title="Tasks"
        description="Organize and track your work across the team"
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex rounded-lg border border-border overflow-hidden">
              {(['kanban', 'list'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium transition-colors capitalize focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
                    viewMode === m
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                  role="tab"
                  aria-selected={viewMode === m}
                  aria-label={`View tasks in ${m} mode`}
                >
                  {m}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Task</span>
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Search tasks by title, description, or related contact"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-24" />
              <div className="space-y-3 bg-muted/30 rounded-xl p-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} className="h-32 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load tasks. {error?.message || 'Please try again.'}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !isError && totalTasks === 0 && !searchQuery && (
        <EmptyState
          icon={<CheckSquare className="h-12 w-12" />}
          title="No tasks yet"
          description="Create your first task to start organizing your work."
          action={{
            label: 'Add task',
            onClick: () => setFormOpen(true),
          }}
        />
      )}

      {/* No Search Results */}
      {!isLoading && !isError && totalTasks === 0 && searchQuery && (
        <EmptyState
          icon={<Search className="h-12 w-12" />}
          title="No tasks found"
          description={`No tasks match "${searchQuery}". Try a different search term.`}
          action={{
            label: 'Clear search',
            onClick: () => setSearchQuery(''),
          }}
        />
      )}

      {/* Kanban View */}
      {!isLoading && !isError && filteredKanban && viewMode === 'kanban' && totalTasks > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="group" aria-label="Task board">
          {filteredKanban.columns.map((col) => (
            <TaskColumn
              key={col.status}
              status={col.status}
              tasks={col.tasks}
              onEdit={setEditingTask}
              onDelete={setDeletingTask}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && !isError && filteredKanban && viewMode === 'list' && totalTasks > 0 && (
        <div className="space-y-3">
          {filteredKanban.columns.flatMap((c) => c.tasks).map((task) => (
            <TaskCard key={task.id} task={task} onEdit={setEditingTask} onDelete={setDeletingTask} />
          ))}
        </div>
      )}

      {/* Forms and Dialogs */}
      {formOpen && <TaskForm onClose={() => setFormOpen(false)} />}
      {editingTask && <TaskEditForm task={editingTask} onClose={() => setEditingTask(null)} />}
      {deletingTask && (
        <DeleteTaskDialog task={deletingTask} onClose={() => setDeletingTask(null)} />
      )}
    </div>
  );
}
