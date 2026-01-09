export interface PitInput {
  gross_income: number;
  allowable_deductions: number; // Business expenses
  non_taxable_income: number;
  actual_rent_paid: number; // Critical for Rent Relief
}

export interface PitResult {
  gross_income: number;
  taxable_income: number;
  reliefs: number;
  cra: number; // Deprecated but kept for type safety (always 0)
  rent_relief: number;
  tax_payable: number;
  effective_rate: number;
  is_exempt: boolean;
  breakdown: { band: number; rate: number; tax: number; }[];
}

const EXEMPTION_THRESHOLD = 800_000;

const PIT_BANDS = [
  { threshold: 800_000, rate: 0.00 },   // First 800k @ 0%
  { threshold: 2_200_000, rate: 0.15 }, // Next 2.2m (upto 3m) @ 15%
  { threshold: 9_000_000, rate: 0.18 }, // Next 9m (upto 12m) @ 18%
  { threshold: 13_000_000, rate: 0.21 },// Next 13m (upto 25m) @ 21%
  { threshold: 25_000_000, rate: 0.23 },// Next 25m (upto 50m) @ 23%
  { threshold: Infinity, rate: 0.25 },  // Above 50m @ 25%
];

export function calculateRelief(_grossIncome: number, actualRent: number): number {
  // New Rent Relief: Lower of ₦500,000 or 20% of annual rent paid
  // Wait, prompt said: "lower of ₦500,000 or 20% of annual rent paid"
  // Previous logic was 20% of gross income.
  // Correction based on prompt: "lower of ₦500,000 or 20% of annual rent paid"
  // But usually rent relief is based on relevant income?
  // Re-reading prompt: "New Rent Relief introduced: lower of ₦500,000 or 20% of annual rent paid"
  return Math.min(500_000, actualRent * 0.20);
}

export function calculatePIT(input: PitInput): PitResult {
  const { gross_income, allowable_deductions, non_taxable_income, actual_rent_paid } = input;

  // 1. Check Exemption (Employees earning 800,000 or less)
  // Assuming gross_income represents total assessable income
  if (gross_income <= EXEMPTION_THRESHOLD) {
    return {
      gross_income,
      taxable_income: 0,
      reliefs: 0,
      cra: 0,
      rent_relief: 0,
      tax_payable: 0,
      effective_rate: 0,
      is_exempt: true,
      breakdown: []
    };
  }

  // 2. Consolidated Relief Allowance (CRA) - ABOLISHED
  const cra = 0;

  // 3. Rent Relief (New Finance Act)
  const rent_relief = calculateRelief(gross_income, actual_rent_paid);

  // 4. Total Reliefs
  const total_reliefs = cra + rent_relief + non_taxable_income;

  // 5. Taxable Income
  // Chargeable Income = Gross - Deductions - Reliefs
  let taxable_income = gross_income - allowable_deductions - total_reliefs;
  taxable_income = Math.max(0, taxable_income);

  // 6. Compute Tax (Chargeable Income)
  let tax_payable = 0;
  let remaining_taxable = taxable_income;
  const breakdown: { band: number; rate: number; tax: number; }[] = [];

  for (const band of PIT_BANDS) {
    if (remaining_taxable <= 0) break;

    const taxable_amount = Math.min(remaining_taxable, band.threshold);
    const tax_on_band = taxable_amount * band.rate;

    tax_payable += tax_on_band;
    breakdown.push({ band: taxable_amount, rate: band.rate, tax: tax_on_band });

    remaining_taxable -= taxable_amount;
  }

  return {
    gross_income,
    taxable_income,
    reliefs: total_reliefs,
    cra,
    rent_relief,
    tax_payable,
    effective_rate: gross_income > 0 ? (tax_payable / gross_income) : 0,
    is_exempt: false,
    breakdown
  };
}
