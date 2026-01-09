export type WhtType =
    | 'Dividend'
    | 'Interest'
    | 'Royalty'
    | 'Rent'
    | 'Contract'
    | 'Professional'
    | 'Consultancy'
    | 'Commission'
    | 'DirectorFee'
    | 'SalesOfGoods';

export interface WhtResult {
    amount: number;
    rate: number;
    tax_payable: number;
    type: WhtType;
}

export const WHT_RATES: Record<WhtType, number> = {
    'Dividend': 0.10,
    'Interest': 0.10,
    'Royalty': 0.10,
    'Rent': 0.10,
    'Contract': 0.05, // Construction/Contracts
    'Professional': 0.05,
    'Consultancy': 0.05,
    'Commission': 0.05,
    'DirectorFee': 0.10,
    'SalesOfGoods': 0.02, // New 2025
};

export function calculateWHT(amount: number, type: WhtType): WhtResult {
    const rate = WHT_RATES[type] || 0.0;
    const tax_payable = amount * rate;

    return {
        amount,
        rate,
        tax_payable,
        type
    };
}
