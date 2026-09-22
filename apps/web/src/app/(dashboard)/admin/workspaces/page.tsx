'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  _count: {
    members: number;
    projects: number;
    contacts: number;
  };
}

interface WorkspaceStats {
  totalMembers: number;
  totalProjects: number;
  totalContacts: number;
  totalDeals: number;
  storageUsed: number;
}

export default function AdminWorkspacesPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAuthStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [workspaceStats, setWorkspaceStats] = useState<WorkspaceStats | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isSuperAdmin()) {
      router.push('/dashboard');
      return;
    }
    fetchWorkspaces();
  }, [page, isSuperAdmin, router]);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `http://localhost:3001/admin/workspaces?page=${page}&limit=10`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch workspaces');

      const data = await response.json();
      setWorkspaces(data.data);
      setTotalPages(data.meta.totalPages);
    } catch (error) {
      console.error('Error fetching workspaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaceStats = async (workspaceId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `http://localhost:3001/admin/workspaces/${workspaceId}/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch workspace stats');

      const data = await response.json();
      setWorkspaceStats(data);
      setSelectedWorkspace(workspaceId);
    } catch (error) {
      console.error('Error fetching workspace stats:', error);
    }
  };

  const updateWorkspaceStatus = async (workspaceId: string, status: 'ACTIVE' | 'SUSPENDED') => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `http://localhost:3001/admin/workspaces/${workspaceId}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) throw new Error('Failed to update workspace status');

      await fetchWorkspaces();
      alert(`Workspace ${status === 'ACTIVE' ? 'activated' : 'suspended'} successfully`);
    } catch (error) {
      console.error('Error updating workspace status:', error);
      alert('Failed to update workspace status');
    }
  };

  const deleteWorkspace = async (workspaceId: string, workspaceName: string) => {
    if (!confirm(`Are you sure you want to delete workspace "${workspaceName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `http://localhost:3001/admin/workspaces/${workspaceId}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete workspace');

      await fetchWorkspaces();
      alert('Workspace deleted successfully');
      if (selectedWorkspace === workspaceId) {
        setSelectedWorkspace(null);
        setWorkspaceStats(null);
      }
    } catch (error) {
      console.error('Error deleting workspace:', error);
      alert('Failed to delete workspace');
    }
  };

  if (!isSuperAdmin()) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workspace Management</h1>
        <p className="text-gray-600">Manage all workspaces in the system</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workspaces List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">All Workspaces</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading workspaces...</div>
            ) : workspaces.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No workspaces found</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Workspace
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Members
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Projects
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {workspaces.map((workspace) => (
                        <tr key={workspace.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-medium text-gray-900">{workspace.name}</div>
                              <div className="text-sm text-gray-500">/{workspace.slug}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                workspace.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {workspace.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {workspace._count.members}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {workspace._count.projects}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => fetchWorkspaceStats(workspace.id)}
                                className="text-blue-600 hover:text-blue-800 font-medium"
                              >
                                View Stats
                              </button>
                              {workspace.status === 'ACTIVE' ? (
                                <button
                                  onClick={() => updateWorkspaceStatus(workspace.id, 'SUSPENDED')}
                                  className="text-orange-600 hover:text-orange-800 font-medium"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => updateWorkspaceStatus(workspace.id, 'ACTIVE')}
                                  className="text-green-600 hover:text-green-800 font-medium"
                                >
                                  Activate
                                </button>
                              )}
                              <button
                                onClick={() => deleteWorkspace(workspace.id, workspace.name)}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t flex items-center justify-between">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Workspace Stats Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Workspace Details</h2>

            {!selectedWorkspace ? (
              <p className="text-gray-500 text-center py-8">
                Select a workspace to view details
              </p>
            ) : workspaceStats ? (
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">Total Members</div>
                  <div className="text-2xl font-bold">{workspaceStats.totalMembers}</div>
                </div>

                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">Total Projects</div>
                  <div className="text-2xl font-bold">{workspaceStats.totalProjects}</div>
                </div>

                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">Total Contacts</div>
                  <div className="text-2xl font-bold">{workspaceStats.totalContacts}</div>
                </div>

                <div className="border-b pb-3">
                  <div className="text-sm text-gray-500">Total Deals</div>
                  <div className="text-2xl font-bold">{workspaceStats.totalDeals}</div>
                </div>

                <div className="pb-3">
                  <div className="text-sm text-gray-500">Storage Used</div>
                  <div className="text-2xl font-bold">
                    {(workspaceStats.storageUsed / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Loading stats...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
