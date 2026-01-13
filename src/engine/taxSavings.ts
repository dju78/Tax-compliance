
export function calculatePersonalIncomeTax(income: number): number {
    if (income <= 800000) return 0;

    let tax = 0;


    // First 300k is exempt? Provided logic says:
    // if income > 800k tax += min(income-800k, 2.2m) * 0.15 ...
    // This looks like specific user provided "Simple Tax Table" logic.
    // Spec:
    // if (income > 800000) tax += Math.min(income - 800000, 2200000) * 0.15;
    // if (income > 3000000) tax += Math.min(income - 3000000, 9000000) * 0.18;
    // ...

    if (income > 800000) tax += Math.min(income - 800000, 2200000) * 0.15;
    if (income > 3000000) tax += Math.min(income - 3000000, 9000000) * 0.18;
    if (income > 12000000) tax += Math.min(income - 12000000, 13000000) * 0.21;
    if (income > 25000000) tax += Math.min(income - 25000000, 25000000) * 0.23;
    if (income > 50000000) tax += (income - 50000000) * 0.25;

    return tax;
}

export function calculateCompanyTax(income: number): number {
    // Spec: turnover <= 100m ? 0 : 34%??
    // Wait, spec says: `return income <= 100000000 ? 0 : income * 0.34;`
    // This is weird (standard is 30% for Large, 20% Medium, 0% Small).
    // I will stick to the SPEC provided by the user for THIS specific checker, 
    // but I'll add a comment that this seems simplified or aggressive.
    return income <= 100000000 ? 0 : income * 0.34;
}

export function calculateTaxSavings(turnover: number, totalExpenses: number, businessType: 'SOLE' | 'LTD') {
    const taxableIncome = Math.max(turnover - totalExpenses, 0);

    const taxWith = businessType === 'SOLE'
        ? calculatePersonalIncomeTax(taxableIncome)
        : calculateCompanyTax(taxableIncome);

    const taxWithout = businessType === 'SOLE'
        ? calculatePersonalIncomeTax(turnover)
        : calculateCompanyTax(turnover);

    return {
        taxWithExpenses: taxWith,
        taxWithoutExpenses: taxWithout,
        savings: taxWithout - taxWith,
        totalExpenses,
        taxableIncome
    };
}
