'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login'); // Redirect to login if not authenticated
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <div>Loading...</div>; // Show a loading state while checking authentication
  }

  if (!isAuthenticated) {
    return null; // Prevent rendering until authentication state is determined
  }

  return (
      <div>
        <h1>Welcome, {user?.firstName} {user?.lastName}</h1>
        <p>Email: {user?.email}</p>
        <p>Company ID: {user?.companyId}</p>
        <p>Roles: {user?.roles.length > 0 ? user.roles.join(', ') : 'No roles assigned'}</p>
      </div>
  );
}
