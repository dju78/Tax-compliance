import { useState } from 'react';

export function Documentation() {
    const [activeSection, setActiveSection] = useState('getting_started');

    const sections = [
        { id: 'getting_started', title: 'Getting Started', icon: '🚀' },
        { id: 'uploads', title: 'Uploading Data', icon: '📂' },
        { id: 'pit', title: 'Personal Income Tax', icon: '👤' },
        { id: 'cit', title: 'Company Income Tax', icon: '🏢' },
        { id: 'vat', title: 'Value Added Tax', icon: '🛒' },
    ];

    return (
        <div style={{ display: 'flex', gap: '2rem', maxWidth: '1200px', margin: '0 auto', alignItems: 'flex-start' }}>
            {/* Sidebar */}
            <div style={{ width: '250px', background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', position: 'sticky', top: '2rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#334155' }}>Contents</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            style={{
                                textAlign: 'left',
                                padding: '0.75rem',
                                borderRadius: '6px',
                                border: 'none',
                                background: activeSection === s.id ? '#e0f2fe' : 'transparent',
                                color: activeSection === s.id ? '#0284c7' : '#64748b',
                                fontWeight: activeSection === s.id ? '600' : '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}
                        >
                            <span>{s.icon}</span>
                            {s.title}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, background: 'white', padding: '3rem', borderRadius: '12px', border: '1px solid #e2e8f0', minHeight: '80vh' }}>
                {activeSection === 'getting_started' && (
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>Welcome to DEAP</h1>
                        <p style={{ lineHeight: '1.6', color: '#475569', marginBottom: '1.5rem' }}>
                            DEAP (Digital Electronic Accounting Platform) is designed to simplify tax compliance for Nigerian individuals and businesses.
                            This platform helps you track expenses, categorise transactions, and generate necessary tax filings automatically.
                        </p>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Key Features</h3>
                        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', color: '#475569' }}>
                            <li><strong>Smart Ledger:</strong> Automatically categorises bank transactions using Nigerian tax rules.</li>
                            <li><strong>Tax Engines:</strong> Dedicated calculators for PIT, CIT, VAT, and CGT.</li>
                            <li><strong>Compliance Checks:</strong> Real-time alerts for missing documents or risky expenses.</li>
                        </ul>
                    </div>
                )}

                {activeSection === 'uploads' && (
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>Uploading Data</h1>
                        <p style={{ lineHeight: '1.6', color: '#475569', marginBottom: '1.5rem' }}>
                            You can upload bank statements (Excel/CSV) or receipts (Images/PDF) directly into DEAP.
                        </p>
                        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem', color: '#1e40af' }}>Use the Correct Format</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e3a8a' }}>Ensure your Excel file has columns for <strong>Date</strong>, <strong>Description</strong>, and <strong>Amount</strong>.</p>
                        </div>
                        <ol style={{ paddingLeft: '1.5rem', lineHeight: '1.8', color: '#475569' }}>
                            <li>Go to the <strong>Upload Data</strong> tab.</li>
                            <li>Drag and drop your file or click "Upload File".</li>
                            <li>Map the columns to match DEAP's fields.</li>
                            <li>Review and categorise transactions before saving.</li>
                        </ol>
                    </div>
                )}

                {activeSection === 'pit' && (
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>Personal Income Tax (PIT)</h1>
                        <p style={{ lineHeight: '1.6', color: '#475569', marginBottom: '1.5rem' }}>
                            For individuals and sole proprietors, DEAP calculates Personal Income Tax based on the graduated tax scale (PITA).
                        </p>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>How it works</h3>
                        <p style={{ lineHeight: '1.6', color: '#475569' }}>
                            1. <strong>Consolidated Relief Allowance (CRA):</strong> Automatically calculated as the higher of ₦200,000 or 1% of Gross Income, plus 20% of Gross Income.<br />
                            2. <strong>Tax Bands:</strong> The remaining taxable income is taxed across the standard 7%, 11%, 15%, 19%, 21%, and 24% bands.<br />
                            3. <strong>Filing:</strong> Use the "Filing Pack" to download your computation sheet.
                        </p>
                    </div>
                )}

                {activeSection === 'cit' && (
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>Company Income Tax (CIT)</h1>
                        <p style={{ lineHeight: '1.6', color: '#475569', marginBottom: '1.5rem' }}>
                            Limited Liability Companies (LTD) are subject to CIT at 30% of taxable profits (for large companies) or 0% / 20% for small/medium companies.
                        </p>
                        <div style={{ background: '#f0fdf4', padding: '1.5rem', borderRadius: '8px', borderLeft: '4px solid #22c55e', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem', color: '#14532d' }}>Small Company Exemption</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#14532d' }}>Companies with turnover under ₦25 million are exempted from CIT, but must still file returns.</p>
                        </div>
                    </div>
                )}

                {activeSection === 'vat' && (
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>Value Added Tax (VAT)</h1>
                        <p style={{ lineHeight: '1.6', color: '#475569', marginBottom: '1.5rem' }}>
                            The current VAT rate is <strong>7.5%</strong>. DEAP tracks Input VAT (on expenses) and Output VAT (on sales) to calculate your net liability.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
