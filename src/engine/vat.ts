export interface VatInput {
    output_vat: number; // VAT collected on sales
    input_vat: number; // VAT paid on expenses
    is_registered: boolean;
}

export interface VatResult {
    vat_payable: number;
    status: string;
}

const VAT_RATE = 0.075;

export function calculateVatFromAmount(amountIncludingVat: number): number {
    // Amount = Base * 1.075
    // Vat = Amount - (Amount / 1.075)
    return amountIncludingVat - (amountIncludingVat / (1 + VAT_RATE));
}

export function addVatToAmount(baseAmount: number): number {
    return baseAmount * VAT_RATE;
}

export function calculateVAT(input: VatInput): VatResult {
    const { output_vat, input_vat, is_registered } = input;

    if (!is_registered) {
        return {
            vat_payable: 0,
            status: 'Not Registered - VAT Awareness Only. No Credit for Input VAT.'
        };
    }

    // Simple Input Credit Mechanism
    // VAT Payable = Output VAT - Input VAT
    const payable = Math.max(0, output_vat - input_vat);

    return {
        vat_payable: payable,
        status: payable > 0 ? 'Payable' : 'Credit Carried Forward'
    };
}
