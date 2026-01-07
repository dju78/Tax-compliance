import * as XLSX from 'xlsx';
import type { Transaction } from './types';

export function generateExcelWorkbook(transactions: Transaction[]) {
    const wb = XLSX.utils.book_new();

    // 1. All Transactions (Source of Truth)
    const allTxnsData = transactions.map(t => ({
        ID: t.id,
        Date: new Date(t.date).toLocaleDateString(),
        Description: t.description,
        Category: t.category_name,
        SubCategory: t.sub_category || '',
        Income: t.amount > 0 ? t.amount : 0,
        Expense: t.amount < 0 ? Math.abs(t.amount) : 0,
        TaxTag: t.tax_tag || 'None',
        TaxYear: t.tax_year_label,
        Notes: t.notes || ''
    }));
    const wsAll = XLSX.utils.json_to_sheet(allTxnsData);
    XLSX.utils.book_append_sheet(wb, wsAll, "All Transactions");

    // 2. Profit & Loss (Traceable Summary)
    const plCats = new Map<string, { income: number, expense: number }>();
    transactions.forEach(t => {
        if (t.excluded_from_tax) return;
        if (t.category_name?.includes('Director Loan')) return; // Exclude DLA from P&L

        const key = t.category_name || 'Uncategorized';
        if (!plCats.has(key)) plCats.set(key, { income: 0, expense: 0 });
        const entry = plCats.get(key)!;

        if (t.amount > 0) entry.income += t.amount;
        else entry.expense += Math.abs(t.amount);
    });

    const plData = Array.from(plCats.entries()).map(([cat, val]) => ({
        Category: cat,
        TotalIncome: val.income,
        TotalExpenses: val.expense,
        Net: val.income - val.expense
    }));
    const wsPL = XLSX.utils.json_to_sheet(plData);
    XLSX.utils.book_append_sheet(wb, wsPL, "Profit & Loss");

    // 3. Tax Year Split
    const years = Array.from(new Set(transactions.map(t => t.tax_year_label || 'Unknown'))).sort();
    const tyData = years.map(year => {
        const txns = transactions.filter(t => t.tax_year_label === year && !t.excluded_from_tax);
        const income = txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
        const expense = txns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
        return {
            TaxYear: year,
            GrossIncome: income,
            TotalExpenses: expense,
            NetProfit: income - expense,
            TxnCount: txns.length
        };
    });
    const wsTY = XLSX.utils.json_to_sheet(tyData);
    XLSX.utils.book_append_sheet(wb, wsTY, "Tax Year Split");

    // 4. Owner / Director Loan Account
    const dlaTxns = transactions.filter(t => t.category_name === 'Director Loan' || t.dla_status === 'confirmed' || t.tax_tag === 'Owner Loan');
    let runningBalance = 0;
    const dlaData = dlaTxns.map(t => {
        // Impact on Company: 
        // Money In (Company received) -> Company Owes Director (Credit to DLA)
        // Money Out (Company paid) -> Director Owes Company (Debit to DLA)
        // Note: This sign convention depends on perspective. 
        // Common: Credit = Liability (Company owes Director).

        const credit = t.amount > 0 ? t.amount : 0; // Director put money in
        const debit = t.amount < 0 ? Math.abs(t.amount) : 0; // Director took money out
        runningBalance += (credit - debit);

        return {
            Date: new Date(t.date).toLocaleDateString(),
            Description: t.description,
            Ref: t.id,
            DirectorInjects: credit,
            DirectorWithdraws: debit,
            Balance: runningBalance
        };
    });
    const wsDLA = XLSX.utils.json_to_sheet(dlaData);
    XLSX.utils.book_append_sheet(wb, wsDLA, "Director Loan Account");

    // 5. Self Assessment (Simple Estimate based on default year)
    // Assuming sole trader logic for MVP
    const defaultYear = years[0] || 'Current';
    const saTxns = transactions.filter(t => t.tax_year_label === defaultYear && !t.excluded_from_tax);
    const grossVal = saTxns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expVal = saTxns.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

    // Simple verification list (Traceability)
    const saTrace = saTxns.map(t => ({
        Type: t.amount > 0 ? 'Income' : 'Expense',
        Category: t.category_name,
        Amount: Math.abs(t.amount),
        Ref: t.id
    }));

    const saSummary = [
        { Item: "Tax Year", Value: defaultYear },
        { Item: "Total Trade Income", Value: grossVal },
        { Item: "Total Allowable Expenses", Value: expVal },
        { Item: "Net Taxable Profit", Value: Math.max(0, grossVal - expVal) },
        { Item: "", Value: "" },
        { Item: "--- Breakdown Below ---", Value: "" }
    ];
    // Combine summary and trace
    const saSheetData = XLSX.utils.sheet_add_json(XLSX.utils.json_to_sheet(saSummary, { skipHeader: true }), saTrace, { origin: "A8" });
    XLSX.utils.book_append_sheet(wb, saSheetData, "Self Assessment");

    // 6. Corporation Expenses Category (Detailed)
    const expenseTxns = transactions.filter(t => t.amount < 0 && !t.excluded_from_tax && !t.category_name?.includes('Loan'));
    const corpExpData = expenseTxns.map(t => ({
        Category: t.category_name || 'Uncategorized',
        SubCategory: t.sub_category || 'General',
        Description: t.description,
        Amount: Math.abs(t.amount),
        TaxTag: t.tax_tag || '-',
        Ref: t.id
    })).sort((a, b) => a.Category.localeCompare(b.Category));

    const wsCorp = XLSX.utils.json_to_sheet(corpExpData);
    XLSX.utils.book_append_sheet(wb, wsCorp, "Corp Expenses Category");

    // Write File
    XLSX.writeFile(wb, "DEAP_Analysis_Hub.xlsx");
}
