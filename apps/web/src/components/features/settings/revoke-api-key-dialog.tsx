'use client';

import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RevokeApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  keyName: string;
  keyPrefix: string;
  isRevoking: boolean;
}

export function RevokeApiKeyDialog({
  open,
  onOpenChange,
  onConfirm,
  keyName,
  keyPrefix,
  isRevoking,
}: RevokeApiKeyDialogProps) {
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
        aria-labelledby="revoke-key-title"
        aria-describedby="revoke-key-description"
      >
        <div className="flex items-start gap-4 p-6">
          <div className="flex-shrink-0 rounded-full bg-destructive/15 p-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex-1 pt-1">
            <h2 id="revoke-key-title" className="text-lg font-semibold text-foreground mb-2">
              Revoke API Key
            </h2>
            <p id="revoke-key-description" className="text-sm text-muted-foreground mb-1">
              Are you sure you want to revoke the API key <strong className="font-semibold text-foreground">{keyName}</strong>?
            </p>
            <code className="block text-xs bg-muted px-2 py-1 rounded font-mono text-foreground my-2">
              {keyPrefix}••••••••••••••••
            </code>
            <p className="text-sm text-muted-foreground">
              Any integrations using this key will immediately stop working. This action cannot be undone.
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="flex-shrink-0 rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Close dialog"
            disabled={isRevoking}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4 bg-muted/30">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isRevoking}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isRevoking}
          >
            {isRevoking ? 'Revoking…' : 'Revoke Key'}
          </Button>
        </div>
      </div>
    </>
  );
}
