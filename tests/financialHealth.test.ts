import { describe, it, expect } from 'vitest';
import {
    calculateFinancialHealth,
    generateHealthInsights,
    getHealthRating
} from '../src/engine/financialHealth';
import type { Transaction, StatementSummary } from '../src/engine/types';

describe('Financial Health Scoring Engine', () => {
    const mockSummary: StatementSummary = {
        total_inflow: 100000,
        total_outflow: 60000,
        net_cash_flow: 40000,
        transaction_count: 50,
        period_start: '2024-01-01',
        period_end: '2024-12-31'
    };

    const mockTransactions: Transaction[] = Array.from({ length: 50 }, (_, i) => ({
        id: `txn-${i}`,
        date: '2024-06-15',
        description: `Transaction ${i}`,
        amount: i % 2 === 0 ? 2000 : -1200,
        category_name: i % 5 === 0 ? undefined : 'Office Expenses',
        tax_tag: i % 3 === 0 ? 'Deductible' : undefined,
        source_type: i % 4 === 0 ? 'BANK_IMPORT' : 'MANUAL',
        company_id: 'company-1',
        personal_profile_id: null,
        sub_category: null,
        dla_status: null,
        excluded_from_tax: false,
        include_in_pit: false,
        include_in_cit: true,
        vat_status: null,
        allowability_status: null,
        allowable_amount: null,
        audit_status: null,
        audit_notes: null,
        compliance_score: null
    }));

    describe('calculateFinancialHealth', () => {
        it('should calculate overall health score', () => {
            const result = calculateFinancialHealth(mockSummary, mockTransactions);

            expect(result.overall).toBeGreaterThanOrEqual(0);
            expect(result.overall).toBeLessThanOrEqual(100);
        });

        it('should calculate all component scores', () => {
            const result = calculateFinancialHealth(mockSummary, mockTransactions);

            expect(result.cashFlowScore).toBeGreaterThanOrEqual(0);
            expect(result.profitabilityScore).toBeGreaterThanOrEqual(0);
            expect(result.taxComplianceScore).toBeGreaterThanOrEqual(0);
            expect(result.expenseManagementScore).toBeGreaterThanOrEqual(0);
        });

        it('should give high score for profitable business', () => {
            const profitableSummary: StatementSummary = {
                ...mockSummary,
                total_inflow: 100000,
                total_outflow: 50000,
                net_cash_flow: 50000
            };

            const result = calculateFinancialHealth(profitableSummary, mockTransactions);
            expect(result.overall).toBeGreaterThan(60);
        });

        it('should give low score for loss-making business', () => {
            const lossSummary: StatementSummary = {
                ...mockSummary,
                total_inflow: 50000,
                total_outflow: 100000,
                net_cash_flow: -50000
            };

            const result = calculateFinancialHealth(lossSummary, mockTransactions);
            expect(result.overall).toBeLessThan(50);
        });

        it('should reward good categorization', () => {
            const wellCategorized = mockTransactions.map(t => ({
                ...t,
                category_name: 'Office Expenses'
            }));

            const result = calculateFinancialHealth(mockSummary, wellCategorized);
            expect(result.taxComplianceScore).toBeGreaterThan(70);
        });

        it('should penalize poor categorization', () => {
            const poorlyCategorized = mockTransactions.map(t => ({
                ...t,
                category_name: undefined
            }));

            const result = calculateFinancialHealth(mockSummary, poorlyCategorized);
            expect(result.taxComplianceScore).toBeLessThan(50);
        });
    });

    describe('generateHealthInsights', () => {
        it('should generate insights for negative cash flow', () => {
            const negativeSummary: StatementSummary = {
                ...mockSummary,
                net_cash_flow: -10000
            };

            const breakdown = calculateFinancialHealth(negativeSummary, mockTransactions);
            const insights = generateHealthInsights(breakdown, negativeSummary, mockTransactions);

            const cashFlowInsight = insights.find(i => i.category === 'Cash Flow');
            expect(cashFlowInsight).toBeDefined();
            expect(cashFlowInsight?.severity).toBe('critical');
        });

        it('should generate insights for uncategorized transactions', () => {
            const uncategorized = mockTransactions.map(t => ({
                ...t,
                category_name: undefined
            }));

            const breakdown = calculateFinancialHealth(mockSummary, uncategorized);
            const insights = generateHealthInsights(breakdown, mockSummary, uncategorized);

            const complianceInsight = insights.find(i => i.category === 'Tax Compliance');
            expect(complianceInsight).toBeDefined();
            expect(complianceInsight?.message).toContain('uncategorized');
        });

        it('should generate positive insights for good performance', () => {
            const excellentSummary: StatementSummary = {
                ...mockSummary,
                total_inflow: 100000,
                total_outflow: 40000,
                net_cash_flow: 60000
            };

            const breakdown = calculateFinancialHealth(excellentSummary, mockTransactions);
            const insights = generateHealthInsights(breakdown, excellentSummary, mockTransactions);

            const positiveInsights = insights.filter(i => i.severity === 'positive');
            expect(positiveInsights.length).toBeGreaterThan(0);
        });
    });

    describe('getHealthRating', () => {
        it('should return Excellent for score >= 80', () => {
            const rating = getHealthRating(85);
            expect(rating.label).toBe('Excellent');
            expect(rating.color).toBe('#10b981');
        });

        it('should return Good for score 60-79', () => {
            const rating = getHealthRating(70);
            expect(rating.label).toBe('Good');
            expect(rating.color).toBe('#3b82f6');
        });

        it('should return Fair for score 40-59', () => {
            const rating = getHealthRating(50);
            expect(rating.label).toBe('Fair');
            expect(rating.color).toBe('#f59e0b');
        });

        it('should return Poor for score < 40', () => {
            const rating = getHealthRating(30);
            expect(rating.label).toBe('Poor');
            expect(rating.color).toBe('#ef4444');
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty transaction list', () => {
            const result = calculateFinancialHealth(mockSummary, []);
            expect(result.overall).toBeGreaterThanOrEqual(0);
            expect(result.overall).toBeLessThanOrEqual(100);
        });

        it('should handle zero revenue', () => {
            const zeroRevenue: StatementSummary = {
                ...mockSummary,
                total_inflow: 0,
                total_outflow: 10000,
                net_cash_flow: -10000
            };

            const result = calculateFinancialHealth(zeroRevenue, mockTransactions);
            expect(result.profitabilityScore).toBe(0);
        });

        it('should handle very large numbers', () => {
            const largeSummary: StatementSummary = {
                ...mockSummary,
                total_inflow: 1000000000,
                total_outflow: 500000000,
                net_cash_flow: 500000000
            };

            const result = calculateFinancialHealth(largeSummary, mockTransactions);
            expect(result.overall).toBeGreaterThanOrEqual(0);
            expect(result.overall).toBeLessThanOrEqual(100);
        });
    });
});
