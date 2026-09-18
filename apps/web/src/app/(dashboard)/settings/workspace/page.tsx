'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import toast from 'react-hot-toast';

const schema = z.object({
  name: z.string().min(2),
  timezone: z.string().min(1),
  currency: z.string().length(3),
  language: z.string().min(2),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});
type Form = z.infer<typeof schema>;

const TIMEZONES = ['UTC','America/New_York','America/Chicago','America/Los_Angeles','America/Sao_Paulo','Europe/London','Europe/Paris','Europe/Berlin','Asia/Dubai','Asia/Kolkata','Asia/Singapore','Asia/Tokyo','Australia/Sydney'];
const CURRENCIES = ['USD','EUR','GBP','BRL','MXN','AED','INR','SGD','JPY','AUD'];
const COLORS = ['#6366f1','#7c3aed','#db2777','#dc2626','#d97706','#059669','#0891b2','#1d4ed8'];

export default function WorkspaceSettingsPage() {
  const { workspace, setWorkspace } = useAuthStore();
  const qc = useQueryClient();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: workspace?.name ?? '',
      timezone: 'UTC',
      currency: 'USD',
      language: 'en',
      primaryColor: workspace?.primaryColor ?? '#6366f1',
    },
  });

  const selectedColor = watch('primaryColor');

  async function onSubmit(data: Form) {
    const r = await apiClient.patch(`/workspaces/${workspace?.id}`, data);
    setWorkspace({ ...workspace!, ...r.data });
    void qc.invalidateQueries({ queryKey: ['settings'] });
    toast.success('Company profile saved');
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-foreground">Company Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Basic information about your workspace</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Company name</label>
              <Input {...register('name')} placeholder="Acme Corp" />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Timezone</label>
                <select {...register('timezone')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Currency</label>
                <select {...register('currency')} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Brand color</label>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setValue('primaryColor', c)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${selectedColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <Input {...register('primaryColor')} className="w-28 font-mono text-xs" placeholder="#6366f1" />
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
