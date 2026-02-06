/**
 * Custom hook for fetching current user information
 */

import { useState, useEffect } from 'react';

interface User {
  name: string | null;
  email: string | null;
}

interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch current user from gap-auth header
 * Returns null values if user cannot be determined (graceful fallback)
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/user');
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch user');
        }

        setUser(result.data);
      } catch (err: any) {
        console.error('Error fetching user:', err);
        setError(err.message || 'An error occurred while fetching user');
        // Set null user for fallback
        setUser({ name: null, email: null });
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error };
}
