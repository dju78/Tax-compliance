
export const CATEGORY_RULES: Record<string, string[]> = {
    'Transport & Travel': ['uber', 'bolt', 'fuel', 'diesel', 'petrol', 'total', 'shell', 'oando', 'air peace', 'flight', 'ticket', 'transport', 'parking'],
    'Utilities': ['nepa', 'phcn', 'ekedc', 'ikedc', 'aedc', 'electricity', 'water', 'waste', 'lawma'],
    'Telephone & Internet': ['mtn', 'glo', 'airtel', '9mobile', 'spectranet', 'starlink', 'data', 'recharge', 'internet'],
    'Bank Charges': ['bank charges', 'sms alert', 'maintenance fee', 'cot', 'transfer fee', 'stamp duty', 'fgn'],
    'Salaries & Wages': ['salary', 'wages', 'stipend', 'allowance', 'payroll', 'consultant'],
    'Rent': ['rent', 'lease', 'tenancy'],
    'Professional Fees': ['legal', 'audit', 'accounting', 'tax', 'consulting', 'firs', 'lirs'],
    'Meals & Entertainment': ['restaurant', 'food', 'kfc', 'chicken', 'dominion', 'pizza', 'lunch', 'dinner'],
    'Store Supplies': ['paper', 'ink', 'stationery', 'printer', 'office'],
    'Software & Subscriptions': ['google', 'aws', 'azure', 'digital ocean', 'hosting', 'domain', 'zoom', 'slack', 'microsoft', 'adobe']
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
