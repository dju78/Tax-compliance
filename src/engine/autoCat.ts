
export const CATEGORY_RULES: Record<string, string[]> = {
    // --- Cost of Sales / Direct Expenses ---
    'Cost of Sales': ['raw materials', 'inventory', 'stock', 'freight in', 'customs duty', 'clearing', 'shipping'],

    // --- Administrative & Operating Expenses ---
    'Rent & Rates': ['rent', 'lease', 'tenancy', 'land use charge', 'luc', 'ground rent', 'service charge'],
    'Utilities': ['nepa', 'phcn', 'ekedc', 'ikedc', 'aedc', 'jedc', 'kedco', 'electricity', 'water rate', 'waste', 'lawma', 'diesel', 'fuel', 'generator'],
    'Telephone & Internet': ['mtn', 'glo', 'airtel', '9mobile', 'spectranet', 'starlink', 'data', 'recharge', 'internet', 'fiberone', 'ipnx'],
    'Transport & Travel': ['uber', 'bolt', 'indriver', 'lagride', 'flight', 'air peace', 'arik', 'ibom air', 'green africa', 'ticket', 'transport', 'allowance', 'mileage'],
    'Repairs & Maintenance': ['repair', 'maintenance', 'servicing', 'mechanic', 'plumber', 'electrician', 'carpenter', 'fix'],

    // --- Professional Services (WHT Implications) ---
    'Professional Fees': ['legal', 'audit', 'accounting', 'tax', 'consulting', 'consultant', 'lawyer', 'barrister', 'solicitor', 'firs', 'lirs', 'scuml'],
    'Bank Charges': ['bank charges', 'sms alert', 'maintenance fee', 'cot', 'transfer fee', 'stamp duty', 'fgn', 'vat on chg'],

    // --- Personnel Costs ---
    'Salaries & Wages': ['salary', 'wages', 'stipend', 'allowance', 'payroll', 'paye', 'pension', 'hmo'],
    'Director Remuneration': ['director fee', 'sitting allowance', 'board meeting'],

    // --- Marketing & Sales ---
    'Advertising & Marketing': ['facebook ads', 'google ads', 'instagram', 'promotion', 'billboard', 'printing', 'branding', 'pr'],
    'Meals & Entertainment': ['restaurant', 'food', 'catering', 'lunch', 'dinner', 'kfc', 'chicken', 'dominion', 'pizza', 'eatery'],

    // --- Office & General ---
    'Office Supplies': ['paper', 'ink', 'stationery', 'printer', 'office', 'consumables', 'provisions'],
    'Software & Subscriptions': ['google', 'aws', 'azure', 'digital ocean', 'hosting', 'domain', 'zoom', 'slack', 'microsoft', 'adobe', 'canva'],

    // --- Financial & Tax ---
    'Taxes & Levies': ['cit', 'vat', 'et', 'wht', 'levy', 'permit', 'license', 'local govt', 'lg'],
    'Interest Expense': ['loan interest', 'overdraft interest'],

    // --- Investment & Capital ---
    'Capital Expenditure': ['asset', 'purchase of', 'furniture', 'computer', 'laptop', 'vehicle', 'car', 'machine'],
    'Investments': ['investment', 'wealth', 'piggyvest', 'cowrywise', 'risevest', 'bonds', 'treasury bills'],

    // --- Other Income (Credit Side) ---
    'Sales Revenue': ['invoice', 'sales', 'payment for services', 'contract'],
    'Interest Income': ['savings interest', 'bank interest', 'interest paid'],
    'Dividend Income': ['dividend'],

    // --- Director / Owner Related (Audit Risks) ---
    'Director Loan': ['loan', 'director', 'owner', 'equity', 'capital', 'drawings', 'deposit', 'contribution', 'personal'],
    'Donations CSR': ['donation', 'charity', 'gift'],
};

export function autoCategorize(description: string): string | null {
    const desc = description.toLowerCase();

    // 1. Check Keywords
    for (const [category, keywords] of Object.entries(CATEGORY_RULES)) {
        if (keywords.some(k => desc.includes(k))) {
            return category;
        }
    }

    // 2. Simple Heuristics based on amount (Weak, but maybe useful for very small amounts?)
    // Skipping for now to avoid false positives.

    return null;
}
