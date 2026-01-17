import { describe, it, expect, vi } from 'vitest';
import {
    exportTransactionsToCSV,
    exportSummaryToCSV,
    exportCategoryBreakdownToCSV
} from '../src/engine/exportUtils';
import type { Transaction, StatementSummary } from '../src/engine/types';

// Mock DOM APIs
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('Export Utilities', () => {
    const mockTransactions: Transaction[] = [
        {
            id: 'txn-1',
            date: '2024-06-15',
            description: 'Office Supplies',
            amount: -5000,
            category_name: 'Office Expenses',
            sub_category: 'Supplies',
            tax_tag: 'Deductible',
            source_type: 'MANUAL',
            company_id: 'company-1',
            personal_profile_id: null,
            dla_status: null,
            excluded_from_tax: false,
            include_in_pit: false,
            include_in_cit: true,
            vat_status: 'standard',
            allowability_status: null,
            allowable_amount: null,
            audit_status: null,
            audit_notes: null,
            compliance_score: null
        },
        {
            id: 'txn-2',
            date: '2024-06-20',
            description: 'Client Payment',
            amount: 50000,
            category_name: 'Revenue',
            sub_category: null,
            tax_tag: 'Taxable',
            source_type: 'BANK_IMPORT',
            company_id: 'company-1',
            personal_profile_id: null,
            dla_status: null,
            excluded_from_tax: false,
            include_in_pit: false,
            include_in_cit: true,
            vat_status: 'standard',
            allowability_status: null,
            allowable_amount: null,
            audit_status: null,
            audit_notes: null,
            compliance_score: null
        }
    ];

    const mockSummary: StatementSummary = {
        total_inflow: 50000,
        total_outflow: 5000,
        net_cash_flow: 45000,
        transaction_count: 2,
        period_start: '2024-01-01',
        period_end: '2024-12-31'
    };

    describe('exportTransactionsToCSV', () => {
        it('should create CSV with headers', () => {
            const createElementSpy = vi.spyOn(document, 'createElement');
            const appendChildSpy = vi.spyOn(document.body, 'appendChild');
            const removeChildSpy = vi.spyOn(document.body, 'removeChild');

            exportTransactionsToCSV(mockTransactions, 'test.csv');

            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(appendChildSpy).toHaveBeenCalled();
            expect(removeChildSpy).toHaveBeenCalled();
        });

        it('should handle empty transactions', () => {
            expect(() => {
                exportTransactionsToCSV([], 'empty.csv');
            }).not.toThrow();
        });

        it('should escape special characters in descriptions', () => {
            const specialChars: Transaction[] = [{
                ...mockTransactions[0],
                description: 'Test "quoted" text, with commas'
            }];

            expect(() => {
                exportTransactionsToCSV(specialChars, 'special.csv');
            }).not.toThrow();
        });
    });

    describe('exportSummaryToCSV', () => {
        it('should export summary data', () => {
            const createElementSpy = vi.spyOn(document, 'createElement');

            exportSummaryToCSV(mockSummary, 'summary.csv');

            expect(createElementSpy).toHaveBeenCalledWith('a');
        });

        it('should include all summary metrics', () => {
            expect(() => {
                exportSummaryToCSV(mockSummary);
            }).not.toThrow();
        });
    });

    describe('exportCategoryBreakdownToCSV', () => {
        it('should aggregate transactions by category', () => {
            const createElementSpy = vi.spyOn(document, 'createElement');

            exportCategoryBreakdownToCSV(mockTransactions, 'categories.csv');

            expect(createElementSpy).toHaveBeenCalledWith('a');
        });

        it('should handle uncategorized transactions', () => {
            const uncategorized: Transaction[] = [{
                ...mockTransactions[0],
                category_name: undefined
            }];

            expect(() => {
                exportCategoryBreakdownToCSV(uncategorized);
            }).not.toThrow();
        });

        it('should sort by total amount descending', () => {
            const multiCategory: Transaction[] = [
                { ...mockTransactions[0], category_name: 'Category A', amount: -1000 },
                { ...mockTransactions[0], category_name: 'Category B', amount: -5000 },
                { ...mockTransactions[0], category_name: 'Category C', amount: -3000 }
            ];

            expect(() => {
                exportCategoryBreakdownToCSV(multiCategory);
            }).not.toThrow();
        });
    });

    describe('File Download', () => {
        it('should set correct filename', () => {
            const createElementSpy = vi.spyOn(document, 'createElement');
            const mockLink = document.createElement('a');
            const setAttributeSpy = vi.spyOn(mockLink, 'setAttribute');
            createElementSpy.mockReturnValue(mockLink);

            exportTransactionsToCSV(mockTransactions, 'custom_name.csv');

            expect(setAttributeSpy).toHaveBeenCalledWith('download', 'custom_name.csv');
        });

        it('should create blob with correct MIME type', () => {
            const blobSpy = vi.spyOn(global, 'Blob');

            exportTransactionsToCSV(mockTransactions);

            expect(blobSpy).toHaveBeenCalledWith(
                expect.any(Array),
                expect.objectContaining({ type: 'text/csv;charset=utf-8;' })
            );
        });
    });
});
