export interface PitInput {
  gross_income: number;
  allowable_deductions: number; // Business expenses
  non_taxable_income: number;
  actual_rent_paid: number; // Critical for 2025 Rent Relief
}

export interface PitResult {
  gross_income: number;
  taxable_income: number;
  reliefs: number;
  tax_payable: number;
  effective_rate: number;
  is_exempt: boolean;
}

const EXEMPTION_THRESHOLD = 800_000;

const PIT_BANDS = [
  { threshold: 300_000, rate: 0.07 },
  { threshold: 300_000, rate: 0.11 },
  { threshold: 500_000, rate: 0.15 },
  { threshold: 500_000, rate: 0.19 },
  { threshold: 1_600_000, rate: 0.21 },
  { threshold: Infinity, rate: 0.24 }, // Top rate
];

/**
 * Calculates Rent Deduction / Relief (Finance Act 2025)
 * Logic: Lower of (Actual Rent Paid) OR (20% of Gross Income, Capped at ₦500k).
 * This encourages transparency and aligns with the "Rent Deduction" nomenclature.
 */
export function calculateRelief(grossIncome: number, actualRent: number): number {
  const cap = Math.min(grossIncome * 0.20, 500_000);
  return Math.min(actualRent, cap);
}

export function calculatePIT(input: PitInput): PitResult {
  const { gross_income, allowable_deductions, non_taxable_income, actual_rent_paid } = input;

  // 1. Check Exemption
  if (gross_income <= EXEMPTION_THRESHOLD) {
    return {
      gross_income,
      taxable_income: 0,
      reliefs: 0,
      tax_payable: 0,
      effective_rate: 0,
      is_exempt: true
    };
  }

  // 2. Calculate Reliefs
  // Relief is on income AFTER business deductions usually, but for PIT on individuals (employees),
  // it's on Gross Emoluments. For Business, it's typically on assessable profit.
  // Let's assume Gross Income here is "Assessable Income".
  // Note: Differentiate between 'Gross Business Revenue' and 'Personal Gross Income'.
  // We assume input.gross_income here is the assessable base.

  const relief = calculateRelief(gross_income - non_taxable_income, actual_rent_paid);

  // 3. Taxable Income
  let taxable_income = gross_income - allowable_deductions - non_taxable_income - relief;
  taxable_income = Math.max(0, taxable_income);

  // 4. Compute Tax
  let tax_payable = 0;
  let remaining_taxable = taxable_income;

  for (const band of PIT_BANDS) {
    if (remaining_taxable <= 0) break;
    const taxable_amount = Math.min(remaining_taxable, band.threshold);
    tax_payable += taxable_amount * band.rate;
    remaining_taxable -= taxable_amount;
  }

  return {
    gross_income,
    taxable_income,
    reliefs: relief,
    tax_payable,
    effective_rate: gross_income > 0 ? (tax_payable / gross_income) : 0,
    is_exempt: false
  };
}
