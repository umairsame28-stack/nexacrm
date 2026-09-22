import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  totpEnabled: boolean;
  systemRole?: 'USER' | 'SUPER_ADMIN';
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  role: string;
}

interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: () => boolean;

  setAuth: (user: User, workspace: Workspace, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  setWorkspace: (workspace: Workspace) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      workspace: null,
      accessToken: null,
      isAuthenticated: false,

      isSuperAdmin: (): boolean => {
        const state = get();
        return state.user?.systemRole === 'SUPER_ADMIN';
      },

      setAuth: (user: User, workspace: Workspace, accessToken: string) => {
        // Also store in localStorage for axios interceptor
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexacrm_access_token', accessToken);
          localStorage.setItem('nexacrm_workspace_id', workspace.id);
        }
        set({ user, workspace, accessToken, isAuthenticated: true });
      },

      setAccessToken: (token: string) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexacrm_access_token', token);
        }
        set({ accessToken: token });
      },

      setWorkspace: (workspace: Workspace) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('nexacrm_workspace_id', workspace.id);
        }
        set({ workspace });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nexacrm_access_token');
          localStorage.removeItem('nexacrm_workspace_id');
        }
        set({ user: null, workspace: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'nexacrm-auth',
      partialize: (state) => ({
        user: state.user,
        workspace: state.workspace,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
