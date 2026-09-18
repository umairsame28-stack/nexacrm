'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MessageSquare, Plus, Phone, Mail, Building2, Briefcase, Clock, Edit, Loader2 } from 'lucide-react';
import { useContact, useContactTimeline, useAddContactNote } from '@/queries/contacts.queries';
import { useGetOrCreateConversation } from '@/queries/inbox.queries';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/ui/avatar';
import { ContactDrawer } from '@/components/features/contacts/contact-drawer';
import { formatDate, formatDateTime, formatPhoneDisplay } from '@/lib/format';
import toast from 'react-hot-toast';

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: contact, isLoading } = useContact(id);
  const { data: timelineData } = useContactTimeline(id);
  const addNote = useAddContactNote(id);
  const createConversation = useGetOrCreateConversation();
  const [noteText, setNoteText] = useState('');
  const [editOpen, setEditOpen] = useState(false);

  async function handleStartChat() {
    try {
      const conversation = await createConversation.mutateAsync(id);
      router.push(`/inbox?conversation=${conversation.id}`);
    } catch (error) {
      // Error already shown by mutation
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!contact) return <div className="text-muted-foreground">Contact not found</div>;

  async function submitNote() {
    if (!noteText.trim()) return;
    await addNote.mutateAsync(noteText);
    setNoteText('');
  }

  const timeline = timelineData?.data ?? [];

  const eventTypeLabel: Record<string, string> = {
    contact_created: 'Contact created',
    contact_updated: 'Contact updated',
    message_sent: 'Message sent',
    message_received: 'Message received',
    lead_created: 'Lead created',
    lead_stage_changed: 'Lead stage changed',
    deal_created: 'Deal created',
    note_added: 'Note added',
  };

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
          <ArrowLeft className="h-4 w-4" /> Contacts
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left panel */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <Avatar firstName={contact.firstName} lastName={contact.lastName} src={contact.avatarUrl} size="xl" />
                <h2 className="mt-3 text-xl font-bold text-foreground">
                  {contact.firstName} {contact.lastName ?? ''}
                </h2>
                {contact.jobTitle && <p className="text-sm text-muted-foreground">{contact.jobTitle}</p>}
                {contact.company && <p className="text-sm text-muted-foreground">{contact.company}</p>}
                <Badge variant="success" className="mt-2">{contact.status.toLowerCase()}</Badge>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2.5 text-foreground">
                  <Phone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  {formatPhoneDisplay(contact.phone)}
                </div>
                {contact.email && (
                  <div className="flex items-center gap-2.5 text-foreground">
                    <Mail className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    {contact.email}
                  </div>
                )}
                {contact.company && (
                  <div className="flex items-center gap-2.5 text-foreground">
                    <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    {contact.company}
                  </div>
                )}
                {contact.jobTitle && (
                  <div className="flex items-center gap-2.5 text-foreground">
                    <Briefcase className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    {contact.jobTitle}
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  Added {formatDate(contact.createdAt)}
                </div>
              </div>

              {contact.tags.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {contact.tags.map(({ tag }) => (
                      <Badge
                        key={tag.id}
                        variant="muted"
                        className="text-xs"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1" 
                  onClick={handleStartChat}
                  disabled={createConversation.isPending}
                >
                  {createConversation.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Starting...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-3.5 w-3.5" /> Start Chat
                    </>
                  )}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right panel — Timeline + Notes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add note */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Add Note</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
                placeholder="Add a note about this contact…"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
              <Button size="sm" className="mt-2" onClick={submitNote} disabled={!noteText.trim() || addNote.isPending}>
                <Plus className="h-3.5 w-3.5" /> Save Note
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No activity yet</p>
              ) : (
                <div className="space-y-4">
                  {timeline.map((event, i) => (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        {i < timeline.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="pb-4 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {eventTypeLabel[event.eventType] ?? event.eventType}
                        </p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(event.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ContactDrawer open={editOpen} onClose={() => setEditOpen(false)} contactId={id} />
    </div>
  );
}
