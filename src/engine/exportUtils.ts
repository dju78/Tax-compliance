import type { Transaction, StatementSummary } from './types';
import * as XLSX from 'xlsx';

/**
 * Enhanced CSV Export
 * Exports transaction data in CSV format for external analysis
 */

export interface CSVExportOptions {
    includeHeaders?: boolean;
    dateFormat?: 'ISO' | 'Locale';
    includeMetadata?: boolean;
}

/**
 * Export transactions to CSV
 */
export function exportTransactionsToCSV(
    transactions: Transaction[],
    filename: string = 'transactions.csv',
    options: CSVExportOptions = {}
): void {
    const {
        includeHeaders = true,
        dateFormat = 'Locale',
        includeMetadata = true
    } = options;

    const rows: string[] = [];

    // Add metadata
    if (includeMetadata) {
        rows.push(`# DEAP Transaction Export`);
        rows.push(`# Generated: ${new Date().toLocaleString()}`);
        rows.push(`# Total Transactions: ${transactions.length}`);
        rows.push('');
    }

    // Add headers
    if (includeHeaders) {
        rows.push('Date,Description,Amount,Category,Sub-Category,Tax Tag,DLA Status,Source Type,VAT Status');
    }

    // Add transaction data
    transactions.forEach(t => {
        const date = dateFormat === 'ISO'
            ? new Date(t.date).toISOString()
            : new Date(t.date).toLocaleDateString();

        const row = [
            date,
            `"${(t.description || '').replace(/"/g, '""')}"`, // Escape quotes
            t.amount,
            `"${(t.category_name || 'Uncategorized').replace(/"/g, '""')}"`,
            `"${(t.sub_category || '').replace(/"/g, '""')}"`,
            t.tax_tag || 'None',
            t.dla_status || 'none',
            t.source_type || 'Manual',
            t.tax_tag || 'none' // Using tax_tag instead of vat_status
        ];

        rows.push(row.join(','));
    });

    // Create and download
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Export summary data to CSV
 */
export function exportSummaryToCSV(
    summary: StatementSummary,
    filename: string = 'financial_summary.csv'
): void {
    const rows = [
        ['Metric', 'Value'],
        ['Total Inflow', summary.total_inflow],
        ['Total Outflow', summary.total_outflow],
        ['Net Cash Flow', summary.net_cash_flow],
        ['Transaction Count', summary.transaction_count],
        ['Period Start', summary.period_start ? new Date(summary.period_start).toLocaleDateString() : 'N/A'],
        ['Period End', summary.period_end ? new Date(summary.period_end).toLocaleDateString() : 'N/A']
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Export category breakdown to CSV
 */
export function exportCategoryBreakdownToCSV(
    transactions: Transaction[],
    filename: string = 'category_breakdown.csv'
): void {
    // Aggregate by category
    const categoryMap = new Map<string, { count: number; total: number }>();

    transactions.forEach(t => {
        const category = t.category_name || 'Uncategorized';
        const existing = categoryMap.get(category) || { count: 0, total: 0 };
        existing.count++;
        existing.total += Math.abs(t.amount);
        categoryMap.set(category, existing);
    });

    // Create CSV
    const rows = [
        ['Category', 'Transaction Count', 'Total Amount', 'Average Amount']
    ];

    Array.from(categoryMap.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([category, data]) => {
            rows.push([
                `"${category}"`,
                data.count.toString(),
                data.total.toFixed(2),
                (data.total / data.count).toFixed(2)
            ]);
        });

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Enhanced Excel Export with Pivot Tables
 */
export function exportToExcelAdvanced(
    transactions: Transaction[],
    summary: StatementSummary,
    companyName: string = 'Your Business'
): void {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Executive Summary
    const summaryData = [
        [companyName],
        ['Financial Summary Report'],
        ['Generated:', new Date().toLocaleDateString()],
        [],
        ['Metric', 'Value'],
        ['Total Revenue', summary.total_inflow],
        ['Total Expenses', summary.total_outflow],
        ['Net Profit/Loss', summary.net_cash_flow],
        ['Profit Margin %', summary.total_inflow > 0 ? ((summary.net_cash_flow / summary.total_inflow) * 100).toFixed(2) + '%' : 'N/A'],
        ['Transaction Count', summary.transaction_count],
        ['Period Start', summary.period_start ? new Date(summary.period_start).toLocaleDateString() : 'N/A'],
        ['Period End', summary.period_end ? new Date(summary.period_end).toLocaleDateString() : 'N/A']
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

    // Set column widths
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Sheet 2: All Transactions
    const txnData = transactions.map(t => ({
        'Date': new Date(t.date).toLocaleDateString(),
        'Description': t.description,
        'Amount': t.amount,
        'Category': t.category_name || 'Uncategorized',
        'Sub-Category': t.sub_category || '',
        'Tax Tag': t.tax_tag || 'None',
        'DLA Status': t.dla_status || 'none',
        'Source': t.source_type || 'Manual',
        'Tax Type': t.tax_tag || 'none' // Using tax_tag instead of vat_status
    }));
    const wsTxns = XLSX.utils.json_to_sheet(txnData);
    XLSX.utils.book_append_sheet(wb, wsTxns, 'Transactions');

    // Sheet 3: Revenue Analysis
    const revenueData = transactions
        .filter(t => t.amount > 0)
        .map(t => ({
            'Date': new Date(t.date).toLocaleDateString(),
            'Description': t.description,
            'Amount': t.amount,
            'Category': t.category_name || 'Uncategorized'
        }));
    const wsRevenue = XLSX.utils.json_to_sheet(revenueData);
    XLSX.utils.book_append_sheet(wb, wsRevenue, 'Revenue');

    // Sheet 4: Expense Analysis
    const expenseData = transactions
        .filter(t => t.amount < 0)
        .map(t => ({
            'Date': new Date(t.date).toLocaleDateString(),
            'Description': t.description,
            'Amount': Math.abs(t.amount),
            'Category': t.category_name || 'Uncategorized',
            'Deductible': (t.tax_tag === 'Non-deductible' || t.tax_tag === 'Non-Deductible') ? 'No' : 'Yes'
        }));
    const wsExpense = XLSX.utils.json_to_sheet(expenseData);
    XLSX.utils.book_append_sheet(wb, wsExpense, 'Expenses');

    // Sheet 5: Category Summary with formulas
    const categoryMap = new Map<string, { count: number; total: number }>();
    transactions.forEach(t => {
        const category = t.category_name || 'Uncategorized';
        const existing = categoryMap.get(category) || { count: 0, total: 0 };
        existing.count++;
        existing.total += Math.abs(t.amount);
        categoryMap.set(category, existing);
    });

    const categoryData = [
        ['Category', 'Count', 'Total Amount', 'Average', '% of Total']
    ];

    const totalAmount = Array.from(categoryMap.values()).reduce((sum, v) => sum + v.total, 0);

    Array.from(categoryMap.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([category, data]) => {
            categoryData.push([
                category,
                data.count.toString(),
                data.total.toString(),
                (data.total / data.count).toString(),
                ((data.total / totalAmount) * 100).toFixed(2) + '%'
            ]);
        });

    const wsCategory = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, wsCategory, 'Category Analysis');

    // Sheet 6: Monthly Summary
    const monthlyMap = new Map<string, { revenue: number; expenses: number }>();
    transactions.forEach(t => {
        const month = new Date(t.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const existing = monthlyMap.get(month) || { revenue: 0, expenses: 0 };

        if (t.amount > 0) {
            existing.revenue += t.amount;
        } else {
            existing.expenses += Math.abs(t.amount);
        }

        monthlyMap.set(month, existing);
    });

    const monthlyData = [
        ['Month', 'Revenue', 'Expenses', 'Profit', 'Margin %']
    ];

    Array.from(monthlyMap.entries())
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .forEach(([month, data]) => {
            const profit = data.revenue - data.expenses;
            const margin = data.revenue > 0 ? ((profit / data.revenue) * 100).toFixed(2) + '%' : 'N/A';
            monthlyData.push([month, data.revenue.toString(), data.expenses.toString(), profit.toString(), margin]);
        });

    const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Analysis');

    // Save file
    const filename = `${companyName.replace(/[^a-z0-9]/gi, '_')}_Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
}
