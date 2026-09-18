'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RemoveMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  memberName: string;
  memberEmail: string;
  isRemoving: boolean;
}

export function RemoveMemberDialog({
  open,
  onOpenChange,
  onConfirm,
  memberName,
  memberEmail,
  isRemoving,
}: RemoveMemberDialogProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-background border border-border rounded-lg shadow-2xl"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="remove-member-title"
        aria-describedby="remove-member-description"
      >
        <div className="flex items-start gap-4 p-6">
          <div className="flex-shrink-0 rounded-full bg-destructive/15 p-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1 pt-1">
            <h2 id="remove-member-title" className="text-lg font-semibold text-foreground mb-2">
              Remove Team Member
            </h2>
            <p id="remove-member-description" className="text-sm text-muted-foreground mb-1">
              Are you sure you want to remove <strong className="font-semibold text-foreground">{memberName}</strong>{' '}
              ({memberEmail}) from this workspace?
            </p>
            <p className="text-sm text-muted-foreground">
              This will immediately revoke their access to all workspace data. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex-shrink-0 rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Close dialog"
            disabled={isRemoving}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-muted/30">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isRemoving}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isRemoving}
          >
            {isRemoving ? 'Removing…' : 'Remove Member'}
          </Button>
        </div>
      </div>
    </>
  );
}
