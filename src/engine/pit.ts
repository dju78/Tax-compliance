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
  cra: number;
  rent_relief: number;
  tax_payable: number;
  effective_rate: number;
  is_exempt: boolean;
  breakdown: { band: number; rate: number; tax: number; }[];
}

const EXEMPTION_THRESHOLD = 800_000;

const PIT_BANDS = [
  { threshold: 300_000, rate: 0.07 },
  { threshold: 300_000, rate: 0.11 },
  { threshold: 500_000, rate: 0.15 },
  { threshold: 500_000, rate: 0.19 },
  { threshold: 1_600_000, rate: 0.21 },
  { threshold: Infinity, rate: 0.24 },
];

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
      cra: 0,
      rent_relief: 0,
      tax_payable: 0,
      effective_rate: 0,
      is_exempt: true,
      breakdown: []
    };
  }

  // 2. Consolidated Relief Allowance (CRA)
  // Higher of ₦200,000 or 1% of Gross Income (whichever is higher) + 20% of Gross Income
  // Note: "Gross Income" definition varies, usually Gross Emoluments. 
  // We will use (input.gross_income - allowable_deductions) as the base if these are business expenses,
  // but for simple PIT usually it's on the Gross. Let's assume input.gross_income is the correct base.
  const craFixed = Math.max(200_000, gross_income * 0.01);
  const craVariable = gross_income * 0.20;
  const cra = craFixed + craVariable;

  // 3. Rent Relief (New Finance Act)
  const rent_relief = calculateRelief(gross_income, actual_rent_paid);

  // 4. Total Reliefs
  // Note: non_taxable_income usually acts as a relief (Pension/NHF/Health)
  const total_reliefs = cra + rent_relief + non_taxable_income;

  // 5. Taxable Income
  // Deduct Allowable Expenses (Business) first? Or are they part of "Reliefs"? 
  // Usually Allowable Deductions reduce Gross to "Assessable", then Reliefs reduce Assessable to "Chargeable".
  // Let's assume: Gross - Deductions - Reliefs = Taxable
  let taxable_income = gross_income - allowable_deductions - total_reliefs;
  taxable_income = Math.max(0, taxable_income);

  // 6. Compute Tax (Chargeable Income)
  let tax_payable = 0;
  let remaining_taxable = taxable_income;
  const breakdown: { band: number; rate: number; tax: number; }[] = [];

  for (const band of PIT_BANDS) {
    if (remaining_taxable <= 0) break;
    // band.threshold is the WIDTH of the band, not the cumulative top.
    // Wait, let's verify logic. standard tables: First 300k @ 7%, Next 300k @ 11%, etc.
    // My constants in previous file were: { threshold: 300_000 ... } which implies width.
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
