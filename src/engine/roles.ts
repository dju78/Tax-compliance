export type UserRole = 'admin' | 'accountant' | 'staff' | 'viewer';

export interface RolePermissions {
    canRead: boolean;
    canWrite: boolean;
}
