
import type { Transaction } from '../types';
// Removed uuid import


export interface CsvParseResult {
    headers: string[];
    rows: string[][];
}

export interface ColumnMapping {
    date: string;
    description: string;
    amount?: string;
    moneyIn?: string;
    moneyOut?: string;
}

/**
 * Parses raw CSV text into headers and rows.
 * Handles basic CSV quoting and delimiters.
 */
export function parseCSV(text: string): CsvParseResult {
    // Simple split for now, robust libraries like PapaParse are better but we are in manual mode
    // We'll handle basic "quoted updates" if possible, or just split by comma
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return { headers: [], rows: [] };

    // Detect delimiter (comma or semicolon)
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';



    // Robust loop for parse
    const parseLineRobust = (line: string) => {
        const result: string[] = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
            const c = line[i];
            if (inQuote) {
                if (c === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') {
                        cur += '"';
                        i++;
                    } else {
                        inQuote = false;
                    }
                } else {
                    cur += c;
                }
            } else {
                if (c === '"') {
                    inQuote = true;
                } else if (c === delimiter) {
                    result.push(cur.trim());
                    cur = '';
                } else {
                    cur += c;
                }
            }
        }
        result.push(cur.trim());
        return result;
    }

    const headers = parseLineRobust(lines[0]);
    const rows = lines.slice(1).map(parseLineRobust);

    return { headers, rows };
}

/**
 * Converts raw string rows into Transactions based on mapping.
 */
export function mapRowsToTransactions(
    rows: string[][],
    headers: string[],
    mapping: ColumnMapping,
    companyId: string
): Transaction[] {
    const transactions: Transaction[] = [];

    const getIdx = (colName: string | undefined) => colName ? headers.indexOf(colName) : -1;

    const dateIdx = getIdx(mapping.date);
    const descIdx = getIdx(mapping.description);
    const amtIdx = getIdx(mapping.amount);
    const inIdx = getIdx(mapping.moneyIn);
    const outIdx = getIdx(mapping.moneyOut);

    rows.forEach((row) => {
        if (row.length !== headers.length) return; // Skip malformed

        const dateStr = row[dateIdx];
        const desc = row[descIdx];

        if (!dateStr || !desc) return;

        // Parse Date
        const date = normalizeDate(dateStr);
        if (!date) return;

        // Parse Amount
        let amount = 0;
        if (amtIdx !== -1) {
            amount = normalizeAmount(row[amtIdx]);
        } else if (inIdx !== -1 && outIdx !== -1) {
            const moneyIn = normalizeAmount(row[inIdx]);
            const moneyOut = normalizeAmount(row[outIdx]);
            if (moneyOut > 0) amount = -Math.abs(moneyOut);
            else amount = Math.abs(moneyIn);
        }

        if (isNaN(amount) || amount === 0) return; // Skip zero or invalid transactions

        transactions.push({
            id: crypto.randomUUID(),
            company_id: companyId,
            date: date,
            description: desc,
            amount: amount,
            is_business: true,
            dla_status: 'none',
            tax_year_label: date.getFullYear().toString(),
            category_name: amount > 0 ? 'Uncategorized Income' : 'Uncategorized Expense'
        });
    });

    return transactions;
}

function normalizeDate(str: string): Date | null {
    // Try standard constructor
    let d = new Date(str);
    if (!isNaN(d.getTime())) return d;

    // Try DD/MM/YYYY
    const parts = str.split(/[\/\-\.]/);
    if (parts.length === 3) {
        // Assume Day-Month-Year if standard fail
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        d = new Date(year, month, day);
        if (!isNaN(d.getTime())) return d;
    }

    return null;
}

function normalizeAmount(str: string): number {
    if (!str) return 0;
    // Remove currency symbols, commas, spaces
    const clean = str.replace(/[^\d.-]/g, '');
    return parseFloat(clean) || 0;
}
