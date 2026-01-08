export interface HelpSection {
    id: string;
    title: string;
    icon: string;
    content: HelpArticle[];
}

export interface HelpArticle {
    title: string;
    body: React.ReactNode;
    keywords: string[];
}

export const HELP_CONTENT: HelpSection[] = [
    {
        id: 'getting-started',
        title: 'Getting Started',
        icon: '🚀',
        content: [
            {
                title: 'Quick Start Checklist',
                keywords: ['start', 'checklist', 'setup', 'business', 'profile'],
                body: 'checklist' // Special marker for the interactive checklist component
            },
            {
                title: '5 Steps to Success',
                keywords: ['guide', 'steps', 'success'],
                body: `
                    <ol>
                        <li><strong>Create Profile:</strong> Enter your Business Name, TIN, Sector, and Address.</li>
                        <li><strong>Pick Tax Type:</strong> Select the relevant taxes (VAT, WHT, CIT, PIT).</li>
                        <li><strong>Select Period:</strong> Choose your reporting frequency (Monthly/Quarterly).</li>
                        <li><strong>Add Transactions:</strong> Use "Upload" for bank statements or "Transactions" for manual entry.</li>
                        <li><strong>Generate Reports:</strong> Go to "Reports" to download your tax summaries.</li>
                    </ol>
                `
            }
        ]
    },
    {
        id: 'bank-upload',
        title: 'Bank Upload Guide',
        icon: '📁',
        content: [
            {
                title: 'Supported CSV Format',
                keywords: ['csv', 'format', 'template', 'upload', 'fail'],
                body: `
                    <p>Ensure your CSV has these columns:</p>
                    <ul>
                        <li><strong>Date:</strong> DD/MM/YYYY or YYYY-MM-DD</li>
                        <li><strong>Narration:</strong> Description of the transaction</li>
                        <li><strong>Amount:</strong> Single column (+/-) OR separate Debit/Credit columns</li>
                    </ul>
                    <p><strong>Common Fixes:</strong> Check for incorrect date formats or merged debit/credit columns.</p>
                `
            },
            {
                title: 'Process Overview',
                keywords: ['process', 'categorisation', 'review'],
                body: `
                    <ol>
                        <li><strong>Upload:</strong> Drag & drop your CSV file.</li>
                        <li><strong>Auto-Categorisation:</strong> The system applies rules to label transactions.</li>
                        <li><strong>Review Queue:</strong> Confirm or edit uncertain categories.</li>
                        <li><strong>Reconciliation:</strong> Ensure the ending balance matches your bank.</li>
                    </ol>
                `
            }
        ]
    },
    {
        id: 'categories',
        title: 'Categories & Tags',
        icon: '🏷️',
        content: [
            {
                title: 'Default Categories',
                keywords: ['sales', 'rent', 'fuel', 'salaries', 'utilities'],
                body: `
                    <ul>
                        <li><strong>Sales:</strong> Revenue from goods/services.</li>
                        <li><strong>Rent:</strong> Office or workspace rental.</li>
                        <li><strong>Fuel/Logistics:</strong> Delivery van fuel, transport costs. (Allowable)</li>
                        <li><strong>Salaries:</strong> Staff wages (Allowable).</li>
                        <li><strong>Personal:</strong> Non-business spending (Non-allowable).</li>
                    </ul>
                `
            },
            {
                title: 'Tax Tags Explained',
                keywords: ['vatable', 'exempt', 'wht', 'zero-rated'],
                body: `
                    <ul>
                        <li><strong>VATable:</strong> Standard rated goods/services (7.5%).</li>
                        <li><strong>Exempt:</strong> Items not subject to VAT (e.g., Medical, Basic Food).</li>
                        <li><strong>WHT on Rent:</strong> 10% for Companies, 10% for Individuals.</li>
                    </ul>
                `
            }
        ]
    },
    {
        id: 'vat',
        title: 'VAT Help',
        icon: '📊',
        content: [
            {
                title: 'Input vs Output VAT',
                keywords: ['input', 'output', 'vat', 'claim'],
                body: `
                    <p><strong>Output VAT:</strong> VAT you collect on Sales. You pay this to NRS.</p>
                    <p><strong>Input VAT:</strong> VAT you pay on Expenses. You claim this back.</p>
                    <p><strong>Net:</strong> Output - Input = What you pay (or refund).</p>
                `
            },
            {
                title: 'Common Mistakes',
                keywords: ['mistakes', 'invoice', 'exempt'],
                body: `
                    <ul>
                        <li>Claiming Input VAT without a valid Tax Invoice.</li>
                        <li>Mixing Exempt Sales (no VAT) with Vatable Sales without apportionment.</li>
                    </ul>
                `
            }
        ]
    },
    {
        id: 'wht',
        title: 'Withholding Tax (WHT)',
        icon: '✂️',
        content: [
            {
                title: 'When it applies',
                keywords: ['wht', 'services', 'rate'],
                body: `
                    <p>Deducted from payments to vendors for qualifying transactions (Rent, Commission, Professional Fees, Contracts).</p>
                    <p><strong>Rates:</strong> Typically 5% or 10% depending on the transaction type and vendor (Individual vs Company).</p>
                `
            }
        ]
    },
    {
        id: 'reports',
        title: 'Reports Guide',
        icon: '📑',
        content: [
            {
                title: 'Report Types',
                keywords: ['profit', 'loss', 'statement', 'cashflow', 'audit'],
                body: `
                    <ul>
                        <li><strong>Profit & Loss:</strong> Income vs Expenses over a period.</li>
                        <li><strong>VAT Schedule:</strong> Detailed list of Vatable transactions for filing.</li>
                        <li><strong>Statement of Account:</strong> Official summary for third parties.</li>
                        <li><strong>Audit Trail:</strong> Record of who changed what and when.</li>
                    </ul>
                `
            }
        ]
    },
    {
        id: 'errors',
        title: 'Fixing Errors',
        icon: '🔧',
        content: [
            {
                title: 'Data Quality',
                keywords: ['duplicate', 'negative', 'uncategorised'],
                body: `
                    <ul>
                        <li><strong>Duplicates:</strong> Delete transactions that appear twice.</li>
                        <li><strong>Uncategorised:</strong> Assign a category to ensure tax accuracy.</li>
                        <li><strong>Negative Amounts:</strong> Ensure expenses are negative and income is positive if manually entering.</li>
                    </ul>
                `
            }
        ]
    },
    {
        id: 'security',
        title: 'Security & Privacy',
        icon: '🔒',
        content: [
            {
                title: 'Data Protection',
                keywords: ['security', 'privacy', 'storage', 'encryption'],
                body: `
                    <p>We use bank-grade encryption for your data. We do not sell your data. Access is restricted to your authorised users.</p>
                    <p><strong>Disclaimer:</strong> This software is a tool. We do not provide legal or tax advice.</p>
                `
            }
        ]
    },
    {
        id: 'support',
        title: 'Support',
        icon: '📞',
        content: [
            {
                title: 'Contact Us',
                keywords: ['contact', 'email', 'whatsapp', 'bug'],
                body: `
                    <p><strong>WhatsApp:</strong> <a href="#" style="color: #16a34a">Chat with Support</a></p>
                    <p><strong>Email:</strong> support@deap.ng (Replies within 24h)</p>
                    <p><strong>Report Bug:</strong> Send a screenshot and description to specific bug email.</p>
                `
            }
        ]
    }
];
