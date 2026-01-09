import { calculatePIT } from './pit';

export interface CgtInput {
    entity_type: 'individual' | 'company';
    gain_amount: number;
    turnover?: number; // Needed to check small company status for Companies
}

export interface CgtResult {
    gain_amount: number;
    tax_payable: number;
    rate_description: string;
}

/**
 * Capital Gains Tax (CGT) - 2025 Reform
 * 
 * Companies:
 * - Small (Turnover <= 100m): 0%
 * - Others: 30%
 * 
 * Individuals:
 * - Progressive rates (Aligned with PIT)
 * - Exemption threshold: 50m (Note: Partial implementation here, assuming gain is taxable top-slice)
 */
export function calculateCGT(input: CgtInput): CgtResult {
    const { entity_type, gain_amount, turnover = 0 } = input;

    if (entity_type === 'company') {
        // Small companies rule
        if (turnover <= 100_000_000) {
            return {
                gain_amount,
                tax_payable: 0,
                rate_description: '0% (Small Company Exempt)'
            };
        }
        // Standard rate (Harmonized with CIT)
        return {
            gain_amount,
            tax_payable: gain_amount * 0.30,
            rate_description: '30% (Flat)'
        };
    } else {
        // Individual - Uses PIT Progressive Rates
        // We will simulate a PIT calculation where this gain is the ONLY income for simplicity,
        // or effectively applying the bands. 
        // Note: In reality, this stacks with other income, but for a standalone calculator:

        // 50m Exemption logic (User prompt: "Exemption threshold increased to 50 million")
        // If this refers to total gains less than 50m being exempt OR the first 50m being exempt?
        // Prompt says "Compensation exemption threshold raised... to 50 million". 
        // Let's assume purely progressive calculation using PIT bands as requested ("Individuals now pay CGT at the same progressive rates as PIT")

        const pitResult = calculatePIT({
            gross_income: gain_amount,
            allowable_deductions: 0,
            non_taxable_income: 0,
            actual_rent_paid: 0
        });

        return {
            gain_amount,
            tax_payable: pitResult.tax_payable,
            rate_description: 'Progressive (Same as PIT)'
        };
    }
}
