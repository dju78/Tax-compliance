import { supabase } from '../supabase';

/**
 * Permission System for Team Collaboration
 * Defines role-based access control and permission checks
 */

export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Permission {
    canViewFinancials: boolean;
    canEditTransactions: boolean;
    canManageTeam: boolean;
    canExportData: boolean;
    canViewReports: boolean;
    canManageSettings: boolean;
    canDeleteData: boolean;
}

/**
 * Get permissions based on user role
 */
export function getPermissions(role: UserRole): Permission {
    switch (role) {
        case 'owner':
            return {
                canViewFinancials: true,
                canEditTransactions: true,
                canManageTeam: true,
                canExportData: true,
                canViewReports: true,
                canManageSettings: true,
                canDeleteData: true
            };

        case 'admin':
            return {
                canViewFinancials: true,
                canEditTransactions: true,
                canManageTeam: true,
                canExportData: true,
                canViewReports: true,
                canManageSettings: true,
                canDeleteData: false // Only owner can delete
            };

        case 'member':
            return {
                canViewFinancials: true,
                canEditTransactions: true,
                canManageTeam: false,
                canExportData: true,
                canViewReports: true,
                canManageSettings: false,
                canDeleteData: false
            };

        case 'viewer':
            return {
                canViewFinancials: true,
                canEditTransactions: false,
                canManageTeam: false,
                canExportData: false,
                canViewReports: true,
                canManageSettings: false,
                canDeleteData: false
            };

        default:
            // No permissions for unknown roles
            return {
                canViewFinancials: false,
                canEditTransactions: false,
                canManageTeam: false,
                canExportData: false,
                canViewReports: false,
                canManageSettings: false,
                canDeleteData: false
            };
    }
}

/**
 * Check if user has specific permission
 */
export function hasPermission(role: UserRole, permission: keyof Permission): boolean {
    const permissions = getPermissions(role);
    return permissions[permission];
}

/**
 * Get user's role in a company
 */
export async function getUserRole(companyId: string, userId?: string): Promise<UserRole | null> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        if (!targetUserId) return null;

        const { data, error } = await supabase
            .from('team_members')
            .select('role')
            .eq('company_id', companyId)
            .eq('user_id', targetUserId)
            .eq('status', 'active')
            .single();

        if (error || !data) return null;

        return data.role as UserRole;
    } catch (error) {
        console.error('Error getting user role:', error);
        return null;
    }
}

/**
 * Log activity to activity_log table
 */
export async function logActivity(
    companyId: string,
    actionType: string,
    description: string,
    entityType?: string,
    entityId?: string,
    metadata?: Record<string, any>
): Promise<void> {
    try {
        await supabase
            .from('activity_log')
            .insert({
                company_id: companyId,
                action_type: actionType,
                entity_type: entityType,
                entity_id: entityId,
                description,
                metadata: metadata || {}
            });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
}

/**
 * Check if user is team member of company
 */
export async function isTeamMember(companyId: string, userId?: string): Promise<boolean> {
    const role = await getUserRole(companyId, userId);
    return role !== null;
}

/**
 * Get all companies where user is a team member
 */
export async function getUserCompanies(userId?: string): Promise<string[]> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;

        if (!targetUserId) return [];

        const { data, error } = await supabase
            .from('team_members')
            .select('company_id')
            .eq('user_id', targetUserId)
            .eq('status', 'active');

        if (error || !data) return [];

        return data.map(m => m.company_id);
    } catch (error) {
        console.error('Error getting user companies:', error);
        return [];
    }
}

/**
 * Permission guard component
 */
export function PermissionGuard({
    role,
    permission,
    children,
    fallback
}: {
    role: UserRole;
    permission: keyof Permission;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) {
    if (hasPermission(role, permission)) {
        return <>{ children } </>;
    }

    return <>{ fallback || null
} </>;
}

/**
 * Role badge component
 */
export function RoleBadge({ role }: { role: UserRole }) {
    const getRoleColor = (r: UserRole) => {
        switch (r) {
            case 'owner': return { bg: '#dcfce7', text: '#166534' };
            case 'admin': return { bg: '#dbeafe', text: '#1e40af' };
            case 'member': return { bg: '#e0e7ff', text: '#4338ca' };
            case 'viewer': return { bg: '#f3f4f6', text: '#374151' };
        }
    };

    const colors = getRoleColor(role);

    return (
        <span style= {{
        padding: '0.25rem 0.75rem',
            borderRadius: '99px',
                background: colors.bg,
                    color: colors.text,
                        fontWeight: '600',
                            fontSize: '0.85rem'
    }
}>
    { role.charAt(0).toUpperCase() + role.slice(1) }
    </span>
    );
}
