'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateContact, useUpdateContact, useContact } from '@/queries/contacts.queries';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().optional(),
  phone: z.string().min(7, 'Enter a valid phone number').regex(/^\+/, 'Must start with + (E.164 format)'),
  email: z.string().email().optional().or(z.literal('')),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  notes: z.string().optional(),
});

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  contactId?: string | null;
}

export function ContactDrawer({ open, onClose, contactId }: Props) {
  const isEdit = !!contactId;
  const { data: contact } = useContact(contactId ?? '');
  const createContact = useCreateContact();
  const updateContact = useUpdateContact(contactId ?? '');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (contact && isEdit) {
      reset({
        firstName: contact.firstName,
        lastName: contact.lastName ?? '',
        phone: contact.phone,
        email: contact.email ?? '',
        company: contact.company ?? '',
        jobTitle: contact.jobTitle ?? '',
        notes: contact.notes ?? '',
      });
    } else if (!isEdit) {
      reset({ firstName: '', lastName: '', phone: '+', email: '', company: '', jobTitle: '', notes: '' });
    }
  }, [contact, isEdit, reset]);

  async function onSubmit(data: Form) {
    const payload = { ...data, email: data.email || undefined };
    if (isEdit) {
      await updateContact.mutateAsync(payload);
    } else {
      await createContact.mutateAsync(payload);
    }
    onClose();
  }

  if (!open) return null;

  const fieldClass = 'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md bg-background border-l border-border shadow-2xl animate-slide-in-right overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">{isEdit ? 'Edit Contact' : 'New Contact'}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">First name *</label>
              <Input {...register('firstName')} placeholder="John" />
              {errors.firstName && <p className="mt-1 text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Last name</label>
              <Input {...register('lastName')} placeholder="Smith" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Phone * (E.164)</label>
            <Input {...register('phone')} placeholder="+14155552671" />
            {errors.phone && <p className="mt-1 text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <Input {...register('email')} type="email" placeholder="john@company.com" />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Company</label>
            <Input {...register('company')} placeholder="Acme Corp" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Job title</label>
            <Input {...register('jobTitle')} placeholder="CEO" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="Quick notes about this contact…"
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Contact'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
