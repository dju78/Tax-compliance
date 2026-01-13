
export function calculateYearComparison(
    currentExpenses: number,
    lastYearExpenses: number,
    currentTurnover: number,
    lastYearTurnover: number
) {
    return {
        expenses: {
            thisYear: currentExpenses,
            lastYear: lastYearExpenses,
            change: lastYearExpenses > 0
                ? ((currentExpenses - lastYearExpenses) / lastYearExpenses) * 100
                : 0
        },
        turnover: {
            thisYear: currentTurnover,
            lastYear: lastYearTurnover,
            change: lastYearTurnover > 0
                ? ((currentTurnover - lastYearTurnover) / lastYearTurnover) * 100
                : 0
        }
    };
}
