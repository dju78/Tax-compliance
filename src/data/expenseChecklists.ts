export interface ChecklistItem {
    id: string;
    label: string;
    description?: string;
    isDisallowed?: boolean; // If true, checking this should trigger a warning/stopper
    warning?: string; // Specific warning message (e.g., "Owner's salary -> NOT allowed")
    isCapitalAsset?: boolean;
}

export interface ChecklistCategory {
    id: string;
    title: string;
    icon: string;
    items: ChecklistItem[];
    riskWeight: number; // For audit risk scoring
}

export const EXPENSE_CHECKLIST_SOLE: ChecklistCategory[] = [
    {
        id: 'staff_labour',
        title: '1. Staff & Labour',
        icon: '🧾',
        riskWeight: 2,
        items: [
            { id: 'salaries', label: 'Employee salaries & wages' },
            { id: 'allowances', label: 'Staff allowances (work-related only)' },
            { id: 'pension', label: 'Pension contributions' },
            { id: 'training', label: 'Staff training costs' },
            { id: 'owner_salary', label: "Owner's salary", isDisallowed: true, warning: 'NOT allowed' }
        ]
    },
    {
        id: 'rent_utilities',
        title: '2. Rent & Utilities',
        icon: '🏢',
        riskWeight: 3,
        items: [
            { id: 'rent', label: 'Shop / office rent' },
            { id: 'electricity', label: 'Electricity (NEPA)' },
            { id: 'gen_fuel', label: 'Generator fuel' },
            { id: 'water', label: 'Water' },
            { id: 'internet', label: 'Internet' },
            { id: 'phone', label: 'Business phone line' },
            { id: 'home_use', label: 'Home use expenses', warning: 'Apportion % for business use only' }
        ]
    },
    {
        id: 'transport',
        title: '3. Transport & Logistics',
        icon: '🚗',
        riskWeight: 6,
        items: [
            { id: 'fuel_biz', label: 'Fuel (business trips only)' },
            { id: 'vehicle_repairs', label: 'Vehicle repairs' },
            { id: 'vehicle_servicing', label: 'Vehicle servicing' },
            { id: 'delivery', label: 'Delivery & haulage' },
            { id: 'personal_trips', label: 'Personal trips', isDisallowed: true, warning: 'Exclude personal usage' }
        ]
    },
    {
        id: 'professional',
        title: '4. Professional & Compliance',
        icon: '📊',
        riskWeight: 4,
        items: [
            { id: 'accountant', label: 'Accountant / tax consultant' },
            { id: 'legal', label: 'Legal fees (business only)' },
            { id: 'bookkeeping', label: 'Bookkeeping services' },
            { id: 'cac', label: 'CAC annual returns' },
            { id: 'firs', label: 'FIRS / State IRS charges' }
        ]
    },
    {
        id: 'marketing',
        title: '5. Marketing & Promotion',
        icon: '📣',
        riskWeight: 5,
        items: [
            { id: 'ads_online', label: 'Online adverts' },
            { id: 'flyers', label: 'Flyers / banners' },
            { id: 'branding', label: 'Branding & signage' },
            { id: 'hosting', label: 'Website hosting' },
            { id: 'domain', label: 'Domain fees' }
        ]
    },
    {
        id: 'office_ict',
        title: '6. Office & ICT',
        icon: '💻',
        riskWeight: 3, // Inferred from similar LTD category or generally low risk
        items: [
            { id: 'stationery', label: 'Stationery' },
            { id: 'printing', label: 'Printing / photocopying' },
            { id: 'software', label: 'Software subscriptions' },
            { id: 'pos', label: 'POS charges' },
            { id: 'bank_fees', label: 'Bank transaction fees' }
        ]
    },
    {
        id: 'repairs',
        title: '7. Repairs & Maintenance',
        icon: '🛠️',
        riskWeight: 5,
        items: [
            { id: 'equip_repair', label: 'Equipment repairs' },
            { id: 'gen_servicing', label: 'Generator servicing' },
            { id: 'shop_repair', label: 'Shop fittings repairs' },
            { id: 'new_assets', label: 'New assets purchase', isDisallowed: true, warning: 'Capital allowance, not expense', isCapitalAsset: true }
        ]
    },
    {
        id: 'finance',
        title: '8. Finance Costs',
        icon: '💰',
        riskWeight: 6,
        items: [
            { id: 'loan_interest', label: 'Interest on business loans' },
            { id: 'bank_charges', label: 'Bank charges' },
            { id: 'loan_repayment', label: 'Loan repayment', isDisallowed: true, warning: 'Not allowed' }
        ]
    },
    {
        id: 'bad_debts',
        title: '9. Bad Debts',
        icon: '📉',
        riskWeight: 7, // High risk
        items: [
            { id: 'debt_income', label: 'Debt previously recorded as income' },
            { id: 'debt_irrecoverable', label: 'Debt confirmed irrecoverable' },
            { id: 'debt_written_off', label: 'Written off in records' }
        ]
    },
    {
        id: 'capital_assets',
        title: '10. Capital Assets (DO NOT EXPENSE)',
        icon: '🧮',
        riskWeight: 0,
        items: [
            { id: 'asset_vehicle', label: 'Vehicle', isCapitalAsset: true },
            { id: 'asset_computer', label: 'Computer', isCapitalAsset: true },
            { id: 'asset_machinery', label: 'Machinery', isCapitalAsset: true },
            { id: 'asset_equipment', label: 'Equipment', isCapitalAsset: true }
        ]
    }
];

export const EXPENSE_CHECKLIST_LTD: ChecklistCategory[] = [
    {
        id: 'staff_employment',
        title: '1. Staff & Employment Costs',
        icon: '🧾',
        riskWeight: 2,
        items: [
            { id: 'salaries', label: 'Salaries & wages' },
            { id: 'allowances', label: 'Allowances (housing, transport, meal – work-related)' },
            { id: 'pension_employer', label: 'Employer pension contributions' },
            { id: 'nhf', label: 'NHF contributions' },
            { id: 'nsitf', label: 'NSITF contributions' },
            { id: 'training', label: 'Staff training & development' },
            { id: 'director_pay', label: "Directors' remuneration", warning: 'Allowed if approved & documented' }
        ]
    },
    {
        id: 'rent_utilities',
        title: '2. Rent & Utilities',
        icon: '🏢',
        riskWeight: 3,
        items: [
            { id: 'rent', label: 'Office / factory rent' },
            { id: 'electricity', label: 'Electricity (NEPA)' },
            { id: 'gen_fuel', label: 'Generator fuel' },
            { id: 'water', label: 'Water' },
            { id: 'internet', label: 'Internet & data' },
            { id: 'phone', label: 'Business telephone lines' }
        ]
    },
    {
        id: 'transport',
        title: '3. Transport & Logistics',
        icon: '🚚',
        riskWeight: 6,
        items: [
            { id: 'fuel_co', label: 'Fuel (company vehicles)' },
            { id: 'vehicle_maint', label: 'Vehicle servicing & repairs' },
            { id: 'staff_travel', label: 'Staff official travel' },
            { id: 'haulage', label: 'Haulage & distribution costs' },
            { id: 'director_personal', label: 'Personal director trips', isDisallowed: true, warning: 'Disallow' }
        ]
    },
    {
        id: 'professional',
        title: '4. Professional, Regulatory & Compliance',
        icon: '📊',
        riskWeight: 4,
        items: [
            { id: 'audit_fee', label: 'Audit fees' },
            { id: 'tax_consultant', label: 'Tax consultant fees' },
            { id: 'legal', label: 'Legal fees (business-related)' },
            { id: 'cac', label: 'CAC annual returns' },
            { id: 'levies', label: 'Industry levies' },
            { id: 'firs', label: 'FIRS / State IRS charges' }
        ]
    },
    {
        id: 'marketing',
        title: '5. Marketing, Sales & Promotion',
        icon: '📣',
        riskWeight: 5,
        items: [
            { id: 'ads', label: 'Advertising (online & offline)' },
            { id: 'branding', label: 'Branding & signage' },
            { id: 'commissions', label: 'Sales commissions' },
            { id: 'website', label: 'Website development & hosting' },
            { id: 'digital_marketing', label: 'Digital marketing tools' }
        ]
    },
    {
        id: 'office_admin',
        title: '6. Office, ICT & Administration',
        icon: '💻',
        riskWeight: 3,
        items: [
            { id: 'stationery', label: 'Stationery' },
            { id: 'printing', label: 'Printing & photocopying' },
            { id: 'software', label: 'Software subscriptions' },
            { id: 'pos', label: 'POS charges' },
            { id: 'bank_charges', label: 'Bank charges' },
            { id: 'data_processing', label: 'Data processing fees' }
        ]
    },
    {
        id: 'repairs',
        title: '7. Repairs & Maintenance',
        icon: '🛠️',
        riskWeight: 5,
        items: [
            { id: 'machinery_maint', label: 'Machinery maintenance' },
            { id: 'equip_repair', label: 'Equipment repairs' },
            { id: 'gen_servicing', label: 'Generator servicing' },
            { id: 'office_maint', label: 'Office maintenance' },
            { id: 'asset_upgrades', label: 'Asset upgrades', isDisallowed: true, warning: 'Capital allowance, not expense' }
        ]
    },
    {
        id: 'finance',
        title: '8. Finance Costs',
        icon: '💰',
        riskWeight: 6,
        items: [
            { id: 'loan_interest', label: 'Interest on business loans' },
            { id: 'bank_interest', label: 'Bank interest & charges' },
            { id: 'loan_fees', label: 'Loan arrangement fees' },
            { id: 'principal_repay', label: 'Loan principal repayment', isDisallowed: true, warning: 'Not allowable' }
        ]
    },
    {
        id: 'bad_debts',
        title: '9. Bad Debts',
        icon: '📉',
        riskWeight: 8,
        items: [
            { id: 'debt_income', label: 'Debt previously included as income' },
            { id: 'irrecoverable', label: 'Confirmed irrecoverable' },
            { id: 'written_off', label: 'Written off in company books' }
        ]
    },
    {
        id: 'capital_assets',
        title: '10. Capital Assets (CLAIM VIA CAPITAL ALLOWANCE)',
        icon: '🧮',
        riskWeight: 0,
        items: [
            { id: 'land', label: 'Land', isCapitalAsset: true },
            { id: 'buildings', label: 'Buildings', isCapitalAsset: true },
            { id: 'plant', label: 'Plant & machinery', isCapitalAsset: true },
            { id: 'vehicles', label: 'Vehicles', isCapitalAsset: true },
            { id: 'computers', label: 'Computers & equipment', isCapitalAsset: true }
        ]
    }
];
