export type QuestionType = 'choice' | 'number' | 'currency';

export interface Question {
    id: string;
    text: string;
    type: QuestionType;
    options?: { label: string; value: string }[];
    condition?: (answers: Record<string, any>) => boolean;
}

export interface QuestionnaireFlow {
    id: string;
    title: string;
    questions: Question[];
}

// Flow for Individuals (PIT)
export const PIT_FLOW: QuestionnaireFlow = {
    id: 'pit',
    title: 'Individual / Sole Trader Assessment',
    questions: [
        {
            id: 'gross_income',
            text: 'What is your Total Annual Gross Income? (Salary + Business Inflow)',
            type: 'currency',
        },
        {
            id: 'expenses',
            text: 'How much did you spend solely on business operations? (Excluding Rent)',
            type: 'currency',
        },
        {
            id: 'pays_rent',
            text: 'Do you pay rent for your residence or business?',
            type: 'choice',
            options: [
                { label: 'Yes', value: 'yes' },
                { label: 'No', value: 'no' },
            ]
        },
        {
            id: 'rent_amount',
            text: 'How much Rent did you pay this year?',
            type: 'currency',
            condition: (answers) => answers['pays_rent'] === 'yes',
        }
    ]
};

// Flow for Companies (CIT)
export const CIT_FLOW: QuestionnaireFlow = {
    id: 'cit',
    title: 'Limited Liability Company Assessment',
    questions: [
        {
            id: 'turnover',
            text: 'What is your Company\'s Total Annual Turnover?',
            type: 'currency',
        },
        {
            id: 'expenses',
            text: 'What were your Total Allowable Business Expenses?',
            type: 'currency',
        }
    ]
};
