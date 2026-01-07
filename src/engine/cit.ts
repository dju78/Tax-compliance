export interface CitInput {
    turnover: number;
    assessable_profit: number;
}

export interface CitResult {
    category: 'Small' | 'Large'; // Medium is obsolete in 2025 Act simplification
    assessable_profit: number;
    tax_rate: number;
    tax_payable: number;
    development_levy: number; // Replaces Education Tax
}

/**
 * Nigeria CIT Logic (Finance Act 2025)
 * Small (Turnover <= 100m): 0% CIT, 0% Levy
 * Large (Turnover > 100m): 30% CIT, 4% Development Levy
 */
export function calculateCIT(input: CitInput): CitResult {
    const { turnover, assessable_profit } = input;

    let category: CitResult['category'] = 'Large';
    let tax_rate = 0.30;
    let levy_rate = 0.04;

    const SMALL_THRESHOLD = 100_000_000;

    if (turnover <= SMALL_THRESHOLD) {
        category = 'Small';
        tax_rate = 0.0;
        levy_rate = 0.0;
    } else {
        category = 'Large'; // "Others"
        tax_rate = 0.30;
        levy_rate = 0.04;
    }

    const tax_payable = assessable_profit * tax_rate;

    // Development Levy - 4% of Assessable Profit
    const development_levy = assessable_profit * levy_rate;

    return {
        category,
        assessable_profit,
        tax_rate,
        tax_payable,
        development_levy
    };
}
