import type { UserRole, RolePermissions } from '../engine/roles';

export const SETTINGS_PERMISSIONS: Record<string, Record<UserRole, RolePermissions>> = {
    companyProfile: {
        admin: { canRead: true, canWrite: true },
        accountant: { canRead: true, canWrite: false },
        staff: { canRead: false, canWrite: false },
        viewer: { canRead: true, canWrite: false },
    },
    taxYears: {
        admin: { canRead: true, canWrite: true },
        accountant: { canRead: true, canWrite: true },
        staff: { canRead: true, canWrite: false },
        viewer: { canRead: true, canWrite: false },
    },
    categories: {
        admin: { canRead: true, canWrite: true },
        accountant: { canRead: true, canWrite: true },
        staff: { canRead: true, canWrite: false },
        viewer: { canRead: true, canWrite: false },
    },
    autoCategorisation: {
        admin: { canRead: true, canWrite: true },
        accountant: { canRead: true, canWrite: true },
        staff: { canRead: false, canWrite: false },
        viewer: { canRead: true, canWrite: false },
    },
    usersRoles: {
        admin: { canRead: true, canWrite: true },
        accountant: { canRead: false, canWrite: false },
        staff: { canRead: false, canWrite: false },
        viewer: { canRead: false, canWrite: false },
    },
};

export function hasPermission(
    userRole: UserRole,
    settingSection: keyof typeof SETTINGS_PERMISSIONS,
    action: 'read' | 'write'
): boolean {
    // Graceful fallback if role is missing or invalid
    const role = userRole || 'viewer';
    const permissions = SETTINGS_PERMISSIONS[settingSection]?.[role];
    if (!permissions) return false;
    return action === 'read' ? permissions.canRead : permissions.canWrite;
}
