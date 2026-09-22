'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import toast from 'react-hot-toast';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const workspaceId = searchParams.get('workspace');

    if (!token || !workspaceId) {
      toast.error('Invalid authentication callback');
      router.push('/login');
      return;
    }

    // Fetch user and workspace data
    async function fetchUserData() {
      try {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const [userRes, workspaceRes] = await Promise.all([
          apiClient.get('/auth/me'),
          apiClient.get(`/workspaces/${workspaceId}`),
        ]);

        const user = userRes.data;
        const workspace = workspaceRes.data;

        setAuth(user, workspace, token!);
        router.push('/dashboard');
      } catch (error) {
        toast.error('Failed to complete authentication');
        router.push('/login');
      }
    }

    fetchUserData();
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h2 className="text-xl font-semibold text-foreground">Completing sign in...</h2>
        <p className="text-sm text-muted-foreground">Please wait while we set up your account.</p>
      </div>
    </div>
  );
}
