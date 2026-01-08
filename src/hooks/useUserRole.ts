import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import type { UserRole } from '../engine/roles';

export function useUserRole() {
    const [role, setRole] = useState<UserRole | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchRole() {
            try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                    setRole(null);
                    setLoading(false);
                    return;
                }

                const { data, error } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', session.user.id)
                    .single();

                if (error) {
                    // Allow 406 (Not Acceptable) usually means no rows found, default to viewer
                    if (error.code === 'PGRST116') {
                        setRole('viewer');
                        return;
                    }
                    throw error;
                }

                setRole(data?.role as UserRole || 'viewer');
            } catch (err) {
                console.error('Error fetching user role:', err);
                setError('Failed to load user permissions');
                setRole('viewer'); // Fail-safe to most restrictive role
            } finally {
                setLoading(false);
            }
        }

        fetchRole();
    }, []);

    return { role, loading, error };
}
