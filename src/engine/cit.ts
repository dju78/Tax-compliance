export interface CitInput {
    turnover: number;
    assessable_profit: number;
}

export interface CitResult {
    category: 'Small' | 'Medium' | 'Large';
    assessable_profit: number;
    tax_rate: number;
    tax_payable: number;
    development_levy: number; // 4% of Assessable Profit
    minimum_etr_applied: boolean;
}

/**
 * Nigeria CIT Logic (Finance Act 2025 - Effective 2026)
 * Small (Turnover <= 100m): 0% CIT, 0% Levy
 * Medium (Turnover > 100m but <= 50b): 30% CIT, 4% Development Levy
 * Large (Turnover > 50b): 30% CIT, 4% Development Levy + 15% Minimum ETR Check (Simplified here as standard CIT)
 */
export function calculateCIT(input: CitInput): CitResult {
    const { turnover, assessable_profit } = input;

    let category: CitResult['category'] = 'Medium';
    let tax_rate = 0.30;
    let levy_rate = 0.04;

    const SMALL_THRESHOLD = 100_000_000;
    const LARGE_THRESHOLD = 50_000_000_000;

    if (turnover <= SMALL_THRESHOLD) {
        category = 'Small';
        tax_rate = 0.0;
        levy_rate = 0.0;
    } else if (turnover <= LARGE_THRESHOLD) {
        category = 'Medium';
        tax_rate = 0.30;
        levy_rate = 0.04;
    } else {
        category = 'Large';
        tax_rate = 0.30;
        levy_rate = 0.04;
        // Large companies also have 15% Minimum ETR rule, ensuring they don't pay less than 15% globally.
        // For this local calculation, we stick to 30% statutory rate.
    }

    const tax_payable = assessable_profit * tax_rate;

    // Development Levy - 4% of Assessable Profit
    const development_levy = assessable_profit * levy_rate;

    return {
        category,
        assessable_profit,
        tax_rate,
        tax_payable,
        development_levy,
        minimum_etr_applied: false // Placeholder for complex ETR logic
    };
}
