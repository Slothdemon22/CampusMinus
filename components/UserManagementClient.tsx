'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';

interface UserManagementClientProps {
  userId: string;
  userRole: 'STUDENT' | 'ADMIN';
  currentUserId: string;
}

export default function UserManagementClient({
  userId,
  userRole,
  currentUserId,
}: UserManagementClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await axios.delete(`/api/users/${userId}`);
      toast.success('User deleted successfully');
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMakeAdmin = async () => {
    if (!confirm('Are you sure you want to make this user an admin?')) {
      return;
    }

    setIsUpdatingRole(true);
    try {
      await axios.put(`/api/users/${userId}`, { role: 'ADMIN' });
      toast.success('User role updated to Admin');
      router.refresh();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user role');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const isCurrentUser = userId === currentUserId;

  return (
    <div className="flex items-center gap-2">
      {userRole === 'STUDENT' && (
        <button
          onClick={handleMakeAdmin}
          disabled={isUpdatingRole || isCurrentUser}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          {isUpdatingRole ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Updating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Make Admin
            </>
          )}
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={isDeleting || isCurrentUser}
        className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
      >
        {isDeleting ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Deleting...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </>
        )}
      </button>
    </div>
  );
}

