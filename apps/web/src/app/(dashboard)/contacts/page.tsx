'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Upload, Search, Phone, Building2, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useContacts, useDeleteContact } from '@/queries/contacts.queries';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ContactDrawer } from '@/components/features/contacts/contact-drawer';
import { formatDate, formatPhoneDisplay, truncate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { useDebounce } from '@/hooks/use-debounce';
import { Alert } from '@/components/ui/alert';

const statusColor: Record<string, 'success' | 'muted' | 'destructive'> = {
  ACTIVE: 'success',
  ARCHIVED: 'muted',
  BLOCKED: 'destructive',
};

export default function ContactsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editContact, setEditContact] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cursor, setCursor] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const deleteContact = useDeleteContact();

  const { data, isLoading, isError, error } = useContacts({
    search: debouncedSearch || undefined,
    cursor: cursor || undefined,
    limit: 50,
  });

  const contacts = data?.data ?? [];
  const total = data?.pagination.total ?? 0;
  const hasNextPage = data?.pagination.hasNextPage ?? false;
  const nextCursor = data?.pagination.nextCursor ?? null;

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = () => setSelectedIds(new Set(contacts.map((c) => c.id)));
  const clearSelection = () => setSelectedIds(new Set());

  // Reset cursor when search changes
  useEffect(() => {
    setCursor(null);
    clearSelection();
  }, [debouncedSearch]);

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} contact(s)? This action cannot be undone.`)) return;
    
    const promises = Array.from(selectedIds).map(id => deleteContact.mutateAsync(id));
    await Promise.all(promises);
    clearSelection();
  };

  const handleNextPage = () => {
    if (nextCursor) {
      setCursor(nextCursor);
      clearSelection();
    }
  };

  const handlePrevPage = () => {
    setCursor(null);
    clearSelection();
  };

  return (
    <div>
      <PageHeader
        title="Contacts"
        description={`${total.toLocaleString()} total contacts`}
        actions={
          <>
            <Button size="sm" onClick={() => { setEditContact(null); setDrawerOpen(true); }}>
              <Plus className="h-4 w-4" /> Add Contact
            </Button>
          </>
        }
      />

      {/* Search */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, email, company…"
            className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-primary/10 border border-primary/20 px-4 py-2.5">
          <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 ml-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleBulkDelete}
              disabled={deleteContact.isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
          <button onClick={clearSelection} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Clear</button>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <Alert variant="destructive" className="mb-4">
          Failed to load contacts. {error instanceof Error ? error.message : 'Please try again.'}
        </Alert>
      )}

      {/* Table */}
      {isLoading ? (
        <ContactsTableSkeleton />
      ) : contacts.length === 0 ? (
        <EmptyState
          icon={<Phone className="h-7 w-7" />}
          title={debouncedSearch ? 'No contacts found' : 'No contacts yet'}
          description={debouncedSearch ? 'Try adjusting your search.' : 'Start building your contact list.'}
          action={!debouncedSearch ? { label: 'Add first contact', onClick: () => { setEditContact(null); setDrawerOpen(true); } } : undefined}
        />
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="rounded border-input"
                      checked={selectedIds.size === contacts.length && contacts.length > 0}
                      onChange={(e) => e.target.checked ? selectAll() : clearSelection()}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead className="hidden lg:table-cell">Company</TableHead>
                  <TableHead className="hidden xl:table-cell">Tags</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Added</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded border-input"
                        checked={selectedIds.has(contact.id)}
                        onChange={() => toggleSelect(contact.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => router.push(`/contacts/${contact.id}`)}
                        className="flex items-center gap-3 text-left hover:text-primary transition-colors"
                      >
                        <Avatar firstName={contact.firstName} lastName={contact.lastName} src={contact.avatarUrl} size="sm" />
                        <div>
                          <p className="font-medium text-foreground">
                            {contact.firstName} {contact.lastName ?? ''}
                          </p>
                          {contact.email && (
                            <p className="text-xs text-muted-foreground hidden sm:block">{truncate(contact.email, 30)}</p>
                          )}
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {formatPhoneDisplay(contact.phone)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {contact.company && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                          {truncate(contact.company, 25)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.slice(0, 3).map(({ tag }) => (
                          <Badge
                            key={tag.id}
                            variant="muted"
                            className="text-xs"
                          >
                            {tag.name}
                          </Badge>
                        ))}
                        {contact.tags.length > 3 && (
                          <span className="text-xs text-muted-foreground">+{contact.tags.length - 3}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={statusColor[contact.status] ?? 'muted'}>
                        {contact.status.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground text-xs">
                      {formatDate(contact.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/contacts/${contact.id}`)}
                          className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="View"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm('Delete this contact?')) deleteContact.mutate(contact.id); }}
                          className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {contacts.length} of {total.toLocaleString()} contacts
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={!cursor}
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={!hasNextPage}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <ContactDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        contactId={editContact}
      />
    </div>
  );
}

function ContactsTableSkeleton() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="w-10"><Skeleton className="h-4 w-4" /></TableCell>
              <TableCell><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div></div></TableCell>
              <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-28" /></TableCell>
              <TableCell className="hidden xl:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell className="w-12" />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
