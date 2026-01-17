import type { Transaction, StatementSummary } from './types';

/**
 * Financial Health Scoring Engine
 * Calculates a comprehensive health score (0-100) based on multiple factors
 */

export interface HealthScoreBreakdown {
    overall: number;
    cashFlowScore: number;
    profitabilityScore: number;
    taxComplianceScore: number;
    expenseManagementScore: number;
}

export interface HealthInsight {
    category: string;
    message: string;
    severity: 'positive' | 'warning' | 'critical';
    recommendation?: string;
}

/**
 * Calculate Cash Flow Score (0-100)
 * Based on: positive cash flow, cash runway, consistency
 */
function calculateCashFlowScore(summary: StatementSummary, transactions: Transaction[]): number {
    let score = 0;

    // Positive cash flow: +40 points
    if (summary.net_cash_flow > 0) {
        score += 40;
    } else if (summary.net_cash_flow > -summary.total_inflow * 0.1) {
        // Small negative (within 10% of income): +20 points
        score += 20;
    }

    // Cash runway calculation: +30 points
    const monthlyExpenses = summary.total_outflow / 12; // Rough estimate
    if (monthlyExpenses > 0) {
        const cashRunwayMonths = summary.net_cash_flow / monthlyExpenses;
        if (cashRunwayMonths >= 6) score += 30;
        else if (cashRunwayMonths >= 3) score += 20;
        else if (cashRunwayMonths >= 1) score += 10;
    }

    // Consistency (based on transaction regularity): +30 points
    if (transactions.length > 10) {
        score += 30; // Sufficient transaction history
    } else if (transactions.length > 5) {
        score += 15;
    }

    return Math.min(100, score);
}

/**
 * Calculate Profitability Score (0-100)
 * Based on profit margin
 */
function calculateProfitabilityScore(summary: StatementSummary): number {
    if (summary.total_inflow === 0) return 0;

    const profitMargin = (summary.net_cash_flow / summary.total_inflow) * 100;

    if (profitMargin >= 20) return 100;
    if (profitMargin >= 15) return 85;
    if (profitMargin >= 10) return 70;
    if (profitMargin >= 5) return 50;
    if (profitMargin >= 0) return 30;

    // Loss scenarios
    if (profitMargin >= -10) return 15;
    return 0;
}

/**
 * Calculate Tax Compliance Score (0-100)
 * Based on categorization completeness and documentation
 */
function calculateTaxComplianceScore(transactions: Transaction[]): number {
    if (transactions.length === 0) return 100; // No transactions = no compliance issues

    let score = 0;

    // Categorization completeness: +50 points
    const categorized = transactions.filter(t =>
        t.category_name && !t.category_name.toLowerCase().includes('uncategorized')
    ).length;
    const categorizationRate = (categorized / transactions.length) * 100;

    if (categorizationRate >= 90) score += 50;
    else if (categorizationRate >= 75) score += 40;
    else if (categorizationRate >= 50) score += 25;
    else score += Math.floor(categorizationRate / 2);

    // Tax tagging: +30 points
    const tagged = transactions.filter(t => t.tax_tag && t.tax_tag !== 'None').length;
    const taggingRate = transactions.length > 0 ? (tagged / transactions.length) * 100 : 0;

    if (taggingRate >= 50) score += 30;
    else if (taggingRate >= 25) score += 20;
    else if (taggingRate >= 10) score += 10;

    // Documentation (source type): +20 points
    const documented = transactions.filter(t =>
        t.source_type && t.source_type !== 'MANUAL'
    ).length;
    const docRate = transactions.length > 0 ? (documented / transactions.length) * 100 : 0;

    if (docRate >= 70) score += 20;
    else if (docRate >= 40) score += 10;
    else if (docRate >= 20) score += 5;

    return Math.min(100, score);
}

/**
 * Calculate Expense Management Score (0-100)
 * Based on expense ratio and spending patterns
 */
function calculateExpenseManagementScore(summary: StatementSummary): number {
    if (summary.total_inflow === 0) return 50; // Neutral if no income

    const expenseRatio = (summary.total_outflow / summary.total_inflow) * 100;

    // Lower expense ratio = better score
    if (expenseRatio <= 50) return 100;
    if (expenseRatio <= 60) return 85;
    if (expenseRatio <= 70) return 70;
    if (expenseRatio <= 80) return 50;
    if (expenseRatio <= 90) return 30;
    if (expenseRatio <= 100) return 15;

    // Spending more than earning
    return Math.max(0, 15 - Math.floor((expenseRatio - 100) / 10));
}

/**
 * Main function to calculate overall financial health score
 */
export function calculateFinancialHealth(
    summary: StatementSummary,
    transactions: Transaction[]
): HealthScoreBreakdown {
    const cashFlowScore = calculateCashFlowScore(summary, transactions);
    const profitabilityScore = calculateProfitabilityScore(summary);
    const taxComplianceScore = calculateTaxComplianceScore(transactions);
    const expenseManagementScore = calculateExpenseManagementScore(summary);

    // Weighted average
    const overall = Math.round(
        (cashFlowScore * 0.30) +
        (profitabilityScore * 0.25) +
        (taxComplianceScore * 0.25) +
        (expenseManagementScore * 0.20)
    );

    return {
        overall,
        cashFlowScore,
        profitabilityScore,
        taxComplianceScore,
        expenseManagementScore
    };
}

/**
 * Generate actionable insights based on health score
 */
export function generateHealthInsights(
    breakdown: HealthScoreBreakdown,
    summary: StatementSummary,
    transactions: Transaction[]
): HealthInsight[] {
    const insights: HealthInsight[] = [];

    // Cash Flow Insights
    if (breakdown.cashFlowScore < 40) {
        insights.push({
            category: 'Cash Flow',
            message: 'Negative cash flow detected',
            severity: 'critical',
            recommendation: 'Review expenses and consider revenue optimization strategies'
        });
    } else if (breakdown.cashFlowScore >= 80) {
        insights.push({
            category: 'Cash Flow',
            message: 'Strong cash flow position',
            severity: 'positive'
        });
    }

    // Profitability Insights
    const profitMargin = summary.total_inflow > 0
        ? (summary.net_cash_flow / summary.total_inflow) * 100
        : 0;

    if (profitMargin < 0) {
        insights.push({
            category: 'Profitability',
            message: `Operating at a loss (${profitMargin.toFixed(1)}% margin)`,
            severity: 'critical',
            recommendation: 'Urgent: Review cost structure and pricing strategy'
        });
    } else if (profitMargin >= 20) {
        insights.push({
            category: 'Profitability',
            message: `Excellent profit margin (${profitMargin.toFixed(1)}%)`,
            severity: 'positive'
        });
    }

    // Tax Compliance Insights
    const uncategorized = transactions.filter(t =>
        !t.category_name || t.category_name.toLowerCase().includes('uncategorized')
    ).length;

    if (uncategorized > 0) {
        insights.push({
            category: 'Tax Compliance',
            message: `${uncategorized} uncategorized transactions`,
            severity: uncategorized > 10 ? 'critical' : 'warning',
            recommendation: 'Categorize all transactions to ensure accurate tax calculations'
        });
    }

    // Expense Management Insights
    const expenseRatio = summary.total_inflow > 0
        ? (summary.total_outflow / summary.total_inflow) * 100
        : 0;

    if (expenseRatio > 80) {
        insights.push({
            category: 'Expense Management',
            message: `High expense ratio (${expenseRatio.toFixed(1)}%)`,
            severity: 'warning',
            recommendation: 'Identify cost reduction opportunities in top expense categories'
        });
    } else if (expenseRatio < 60) {
        insights.push({
            category: 'Expense Management',
            message: `Efficient expense management (${expenseRatio.toFixed(1)}% ratio)`,
            severity: 'positive'
        });
    }

    return insights;
}

/**
 * Get health score rating
 */
export function getHealthRating(score: number): {
    label: string;
    color: string;
    description: string;
} {
    if (score >= 80) {
        return {
            label: 'Excellent',
            color: '#10b981',
            description: 'Your financial health is strong. Keep up the good work!'
        };
    } else if (score >= 60) {
        return {
            label: 'Good',
            color: '#3b82f6',
            description: 'Your finances are in good shape with room for improvement.'
        };
    } else if (score >= 40) {
        return {
            label: 'Fair',
            color: '#f59e0b',
            description: 'Some areas need attention. Review the recommendations below.'
        };
    } else {
        return {
            label: 'Poor',
            color: '#ef4444',
            description: 'Immediate action required. Focus on critical issues first.'
        };
    }
}
