'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalWorkspaces: number;
  activeWorkspaces: number;
  totalProjects: number;
  totalContacts: number;
  totalDeals: number;
}

interface ActivityLog {
  id: string;
  action: string;
  userId: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user: {
    email: string;
    fullName: string;
  };
}

interface FailedLogin {
  id: string;
  email: string;
  ipAddress: string;
  userAgent: string;
  reason: string;
  timestamp: string;
}

interface GrowthData {
  date: string;
  count: number;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  database: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

interface SuperAdmin {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  lastLogin: string | null;
}

export default function AdminSystemPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuthStore();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [failedLogins, setFailedLogins] = useState<FailedLogin[]>([]);
  const [userGrowth, setUserGrowth] = useState<GrowthData[]>([]);
  const [workspaceGrowth, setWorkspaceGrowth] = useState<GrowthData[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [superAdmins, setSuperAdmins] = useState<SuperAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'growth' | 'security'>('overview');

  useEffect(() => {
    if (!isSuperAdmin()) {
      router.push('/dashboard');
      return;
    }
    fetchAllData();
  }, [isSuperAdmin, router]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('nexacrm_access_token');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch all data in parallel
      const [
        statsRes,
        activityRes,
        failedLoginsRes,
        userGrowthRes,
        workspaceGrowthRes,
        healthRes,
        superAdminsRes,
      ] = await Promise.all([
        fetch(`${API_URL}/api/v1/admin/system/stats`, { headers }),
        fetch(`${API_URL}/api/v1/admin/system/activity?limit=20`, { headers }),
        fetch(`${API_URL}/api/v1/admin/system/failed-logins?limit=10`, { headers }),
        fetch(`${API_URL}/api/v1/admin/system/growth/users?days=30`, { headers }),
        fetch(`${API_URL}/api/v1/admin/system/growth/workspaces?days=30`, { headers }),
        fetch(`${API_URL}/api/v1/admin/system/health`, { headers }),
        fetch(`${API_URL}/api/v1/admin/system/super-admins`, { headers }),
      ]);

      const [
        statsData,
        activityData,
        failedLoginsData,
        userGrowthData,
        workspaceGrowthData,
        healthData,
        superAdminsData,
      ] = await Promise.all([
        statsRes.json(),
        activityRes.json(),
        failedLoginsRes.json(),
        userGrowthRes.json(),
        workspaceGrowthRes.json(),
        healthRes.json(),
        superAdminsRes.json(),
      ]);

      setStats(statsData);
      setActivity(activityData);
      setFailedLogins(failedLoginsData);
      setUserGrowth(userGrowthData);
      setWorkspaceGrowth(workspaceGrowthData);
      setHealth(healthData);
      setSuperAdmins(superAdminsData);
    } catch (error) {
      console.error('Error fetching system data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSuperAdmin()) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="text-xl text-gray-600">Loading system monitoring data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Monitoring</h1>
        <p className="text-gray-600">Monitor system health, activity, and growth metrics</p>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b">
        <div className="flex gap-4">
          {['overview', 'activity', 'growth', 'security'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 border-b-2 font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* System Health */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">System Health</h2>
            {health && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        health.status === 'healthy'
                          ? 'bg-green-500'
                          : health.status === 'degraded'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <span className="font-semibold capitalize">{health.status}</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Uptime</div>
                  <div className="font-semibold">
                    {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Database</div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        health.database === 'connected' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    />
                    <span className="font-semibold capitalize">{health.database}</span>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Memory Usage</div>
                  <div className="font-semibold">{health.memory.percentage.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(health.memory.used / 1024 / 1024).toFixed(0)} MB / {(health.memory.total / 1024 / 1024).toFixed(0)} MB
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* System Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">System Statistics</h2>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-600 mb-1">Total Users</div>
                  <div className="text-3xl font-bold text-blue-700">{stats.totalUsers}</div>
                  <div className="text-xs text-blue-600 mt-1">{stats.activeUsers} active</div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-600 mb-1">Total Workspaces</div>
                  <div className="text-3xl font-bold text-green-700">{stats.totalWorkspaces}</div>
                  <div className="text-xs text-green-600 mt-1">{stats.activeWorkspaces} active</div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-purple-600 mb-1">Total Projects</div>
                  <div className="text-3xl font-bold text-purple-700">{stats.totalProjects}</div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm text-orange-600 mb-1">Total Contacts</div>
                  <div className="text-3xl font-bold text-orange-700">{stats.totalContacts}</div>
                </div>
              </div>
            )}
          </div>

          {/* Super Admins */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Super Administrators</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {superAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{admin.email}</td>
                      <td className="px-4 py-3 text-sm">{admin.fullName}</td>
                      <td className="px-4 py-3 text-sm">
                        {admin.lastLogin
                          ? new Date(admin.lastLogin).toLocaleString()
                          : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(admin.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab */}
      {activeTab === 'activity' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent System Activity</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {activity.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div>{log.user.fullName}</div>
                      <div className="text-xs text-gray-500">{log.user.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">{log.action}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.entityType} ({log.entityId.slice(0, 8)})
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Growth Tab */}
      {activeTab === 'growth' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">User Growth (Last 30 Days)</h2>
            <div className="h-64 flex items-end gap-2">
              {userGrowth.map((data, idx) => {
                const maxCount = Math.max(...userGrowth.map((d) => d.count));
                const height = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-1">{data.count}</div>
                    <div
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${height}%` }}
                      title={`${new Date(data.date).toLocaleDateString()}: ${data.count} users`}
                    />
                    {idx % 5 === 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(data.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Workspace Growth (Last 30 Days)</h2>
            <div className="h-64 flex items-end gap-2">
              {workspaceGrowth.map((data, idx) => {
                const maxCount = Math.max(...workspaceGrowth.map((d) => d.count));
                const height = maxCount > 0 ? (data.count / maxCount) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="text-xs text-gray-600 mb-1">{data.count}</div>
                    <div
                      className="w-full bg-green-500 rounded-t"
                      style={{ height: `${height}%` }}
                      title={`${new Date(data.date).toLocaleDateString()}: ${data.count} workspaces`}
                    />
                    {idx % 5 === 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(data.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Recent Failed Login Attempts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {failedLogins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No failed login attempts found
                    </td>
                  </tr>
                ) : (
                  failedLogins.map((login) => (
                    <tr key={login.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(login.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">{login.email}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                          {login.reason}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{login.ipAddress}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {login.userAgent}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
