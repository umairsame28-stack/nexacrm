'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { 
  Search, Filter, UserCheck, UserX, Shield, ShieldOff, 
  MoreVertical, RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: string;
  systemRole: string;
  emailVerified: boolean;
  totpEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  _count: {
    workspaceMembers: number;
    refreshTokens: number;
  };
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!isSuperAdmin()) {
      router.push('/dashboard');
      return;
    }
    loadUsers();
  }, [page, statusFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/users', {
        params: {
          page,
          limit: 20,
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      setUsers(response.data.data);
      setTotal(response.data.meta.total);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    loadUsers();
  };

  const handleSuspendUser = async (userId: string) => {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
      await apiClient.patch(`/admin/users/${userId}/status`, {
        status: 'SUSPENDED',
        reason: 'Suspended by admin',
      });
      toast.success('User suspended successfully');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to suspend user');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      await apiClient.patch(`/admin/users/${userId}/status`, {
        status: 'ACTIVE',
        reason: 'Activated by admin',
      });
      toast.success('User activated successfully');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to activate user');
    }
  };

  const handlePromoteToSuperAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to promote this user to Super Admin?')) return;

    try {
      await apiClient.post(`/admin/users/${userId}/promote-super-admin`);
      toast.success('User promoted to Super Admin');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to promote user');
    }
  };

  const handleDemoteFromSuperAdmin = async (userId: string) => {
    if (!confirm('Are you sure you want to demote this Super Admin?')) return;

    try {
      await apiClient.post(`/admin/users/${userId}/demote-super-admin`);
      toast.success('User demoted from Super Admin');
      loadUsers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to demote user');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-700',
      SUSPENDED: 'bg-red-100 text-red-700',
      INACTIVE: 'bg-gray-100 text-gray-700',
      INVITED: 'bg-blue-100 text-blue-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage all users across the platform
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          <button
            onClick={loadUsers}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{total.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Total Users</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.status === 'ACTIVE').length}
          </div>
          <div className="text-sm text-muted-foreground">Active</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {users.filter(u => u.status === 'SUSPENDED').length}
          </div>
          <div className="text-sm text-muted-foreground">Suspended</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.systemRole === 'SUPER_ADMIN').length}
          </div>
          <div className="text-sm text-muted-foreground">Super Admins</div>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-semibold">User</th>
                <th className="text-left p-4 font-semibold">Email</th>
                <th className="text-left p-4 font-semibold">Status</th>
                <th className="text-left p-4 font-semibold">Role</th>
                <th className="text-left p-4 font-semibold">Workspaces</th>
                <th className="text-left p-4 font-semibold">Last Login</th>
                <th className="text-right p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium">{user.firstName} {user.lastName}</div>
                      <div className="text-sm text-muted-foreground">ID: {user.id.slice(0, 8)}</div>
                    </td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.systemRole === 'SUPER_ADMIN' ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                          <Shield className="h-3 w-3" />
                          Super Admin
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">User</span>
                      )}
                    </td>
                    <td className="p-4">{user._count.workspaceMembers}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {user.lastLoginAt 
                        ? new Date(user.lastLoginAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        {user.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handleSuspendUser(user.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                            title="Suspend User"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(user.id)}
                            className="p-2 hover:bg-green-50 rounded-lg text-green-600"
                            title="Activate User"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                        
                        {user.systemRole === 'SUPER_ADMIN' ? (
                          <button
                            onClick={() => handleDemoteFromSuperAdmin(user.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                            title="Demote from Super Admin"
                          >
                            <ShieldOff className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePromoteToSuperAdmin(user.id)}
                            className="p-2 hover:bg-purple-50 rounded-lg text-purple-600"
                            title="Promote to Super Admin"
                          >
                            <Shield className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div className="p-4 border-t flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * 20 >= total}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
