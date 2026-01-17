import { describe, it, expect } from 'vitest';
import {
    getPermissions,
    hasPermission,
    type UserRole
} from '../src/utils/permissions';

describe('Permission System', () => {
    describe('getPermissions', () => {
        it('should give owner full permissions', () => {
            const perms = getPermissions('owner');

            expect(perms.canViewFinancials).toBe(true);
            expect(perms.canEditTransactions).toBe(true);
            expect(perms.canManageTeam).toBe(true);
            expect(perms.canExportData).toBe(true);
            expect(perms.canViewReports).toBe(true);
            expect(perms.canManageSettings).toBe(true);
            expect(perms.canDeleteData).toBe(true);
        });

        it('should give admin most permissions except delete', () => {
            const perms = getPermissions('admin');

            expect(perms.canViewFinancials).toBe(true);
            expect(perms.canEditTransactions).toBe(true);
            expect(perms.canManageTeam).toBe(true);
            expect(perms.canExportData).toBe(true);
            expect(perms.canViewReports).toBe(true);
            expect(perms.canManageSettings).toBe(true);
            expect(perms.canDeleteData).toBe(false); // Only difference
        });

        it('should give member limited permissions', () => {
            const perms = getPermissions('member');

            expect(perms.canViewFinancials).toBe(true);
            expect(perms.canEditTransactions).toBe(true);
            expect(perms.canExportData).toBe(true);
            expect(perms.canViewReports).toBe(true);
            expect(perms.canManageTeam).toBe(false);
            expect(perms.canManageSettings).toBe(false);
            expect(perms.canDeleteData).toBe(false);
        });

        it('should give viewer read-only permissions', () => {
            const perms = getPermissions('viewer');

            expect(perms.canViewFinancials).toBe(true);
            expect(perms.canViewReports).toBe(true);
            expect(perms.canEditTransactions).toBe(false);
            expect(perms.canManageTeam).toBe(false);
            expect(perms.canExportData).toBe(false);
            expect(perms.canManageSettings).toBe(false);
            expect(perms.canDeleteData).toBe(false);
        });
    });

    describe('hasPermission', () => {
        it('should correctly check owner permissions', () => {
            expect(hasPermission('owner', 'canDeleteData')).toBe(true);
            expect(hasPermission('owner', 'canManageTeam')).toBe(true);
        });

        it('should correctly check admin permissions', () => {
            expect(hasPermission('admin', 'canManageTeam')).toBe(true);
            expect(hasPermission('admin', 'canDeleteData')).toBe(false);
        });

        it('should correctly check member permissions', () => {
            expect(hasPermission('member', 'canEditTransactions')).toBe(true);
            expect(hasPermission('member', 'canManageTeam')).toBe(false);
        });

        it('should correctly check viewer permissions', () => {
            expect(hasPermission('viewer', 'canViewReports')).toBe(true);
            expect(hasPermission('viewer', 'canEditTransactions')).toBe(false);
        });
    });

    describe('Role Hierarchy', () => {
        const roles: UserRole[] = ['owner', 'admin', 'member', 'viewer'];

        it('should maintain proper hierarchy for team management', () => {
            expect(hasPermission('owner', 'canManageTeam')).toBe(true);
            expect(hasPermission('admin', 'canManageTeam')).toBe(true);
            expect(hasPermission('member', 'canManageTeam')).toBe(false);
            expect(hasPermission('viewer', 'canManageTeam')).toBe(false);
        });

        it('should maintain proper hierarchy for editing', () => {
            expect(hasPermission('owner', 'canEditTransactions')).toBe(true);
            expect(hasPermission('admin', 'canEditTransactions')).toBe(true);
            expect(hasPermission('member', 'canEditTransactions')).toBe(true);
            expect(hasPermission('viewer', 'canEditTransactions')).toBe(false);
        });

        it('should maintain proper hierarchy for deletion', () => {
            expect(hasPermission('owner', 'canDeleteData')).toBe(true);
            expect(hasPermission('admin', 'canDeleteData')).toBe(false);
            expect(hasPermission('member', 'canDeleteData')).toBe(false);
            expect(hasPermission('viewer', 'canDeleteData')).toBe(false);
        });

        it('should allow all roles to view', () => {
            roles.forEach(role => {
                expect(hasPermission(role, 'canViewFinancials')).toBe(true);
                expect(hasPermission(role, 'canViewReports')).toBe(true);
            });
        });
    });

    describe('Permission Combinations', () => {
        it('should allow owner to do everything', () => {
            const permissions = [
                'canViewFinancials',
                'canEditTransactions',
                'canManageTeam',
                'canExportData',
                'canViewReports',
                'canManageSettings',
                'canDeleteData'
            ] as const;

            permissions.forEach(perm => {
                expect(hasPermission('owner', perm)).toBe(true);
            });
        });

        it('should restrict viewer appropriately', () => {
            const restrictedPermissions = [
                'canEditTransactions',
                'canManageTeam',
                'canExportData',
                'canManageSettings',
                'canDeleteData'
            ] as const;

            restrictedPermissions.forEach(perm => {
                expect(hasPermission('viewer', perm)).toBe(false);
            });
        });
    });
});
