'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import {
  Users, Building2, Activity, TrendingUp, Shield, AlertTriangle,
  BarChart3, Database
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

interface SystemStats {
  users: {
    total: number;
    active: number;
    suspended: number;
    superAdmins: number;
    recentLogins: number;
  };
  workspaces: {
    total: number;
    active: number;
    suspended: number;
  };
  data: {
    contacts: number;
    leads: number;
    deals: number;
    conversations: number;
    messages: number;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isSuperAdmin } = useAuthStore();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuperAdmin()) {
      router.push('/dashboard');
      return;
    }

    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiClient.get('/admin/system/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <div className="text-center text-muted-foreground">
          Failed to load system statistics
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          System-wide overview and management
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/users">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold mt-1">{stats.users.total.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.users.active} active
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/workspaces">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Workspaces</p>
                <p className="text-2xl font-bold mt-1">{stats.workspaces.total.toLocaleString()}</p>
                <p className="text-xs text-green-600 mt-1">
                  {stats.workspaces.active} active
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/admin/system">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recent Logins</p>
                <p className="text-2xl font-bold mt-1">{stats.users.recentLogins.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
              </div>
              <div className="h-12 w-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>
        </Link>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Super Admins</p>
              <p className="text-2xl font-bold mt-1">{stats.users.superAdmins}</p>
              <p className="text-xs text-muted-foreground mt-1">System-wide</p>
            </div>
            <div className="h-12 w-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Data Overview */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Platform Data</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold text-primary">
              {stats.data.contacts.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Contacts</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-600">
              {stats.data.leads.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Leads</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {stats.data.deals.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Deals</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.data.conversations.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Conversations</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {stats.data.messages.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Messages</div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/users">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <Users className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold mb-1">Manage Users</h3>
              <p className="text-sm text-muted-foreground">
                View, suspend, or manage user accounts
              </p>
            </Card>
          </Link>

          <Link href="/admin/workspaces">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <Building2 className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="font-semibold mb-1">Manage Workspaces</h3>
              <p className="text-sm text-muted-foreground">
                Monitor and control workspace access
              </p>
            </Card>
          </Link>

          <Link href="/admin/system">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <BarChart3 className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="font-semibold mb-1">System Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                View metrics, logs, and system health
              </p>
            </Card>
          </Link>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold">Suspended Accounts</h3>
              <p className="text-sm text-muted-foreground">Requires attention</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Suspended Users</span>
              <span className="font-semibold text-yellow-600">{stats.users.suspended}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Suspended Workspaces</span>
              <span className="font-semibold text-yellow-600">{stats.workspaces.suspended}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Platform Health</h3>
              <p className="text-sm text-muted-foreground">All systems operational</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-600 font-medium">System Healthy</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
