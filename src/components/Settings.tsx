import { useState } from 'react';

export function Settings() {
    const [activeTab, setActiveTab] = useState<'profile' | 'tax_year' | 'categories' | 'rules' | 'users'>('profile');

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>Settings & Configuration</h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                <TabButton label="Company Profile" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
                <TabButton label="Tax Years" isActive={activeTab === 'tax_year'} onClick={() => setActiveTab('tax_year')} />
                <TabButton label="Categories" isActive={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />
                <TabButton label="Auto-Categorisation" isActive={activeTab === 'rules'} onClick={() => setActiveTab('rules')} />
                <TabButton label="Users & Roles" isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
            </div>

            {/* Content Area */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                {activeTab === 'profile' && <CompanyProfileSettings />}
                {activeTab === 'tax_year' && <TaxYearSettings />}
                {activeTab === 'categories' && <CategorySettings />}
                {activeTab === 'rules' && <AutoCatRules />}
                {activeTab === 'users' && <UserRoleSettings />}
            </div>
        </div>
    );
}

function TabButton({ label, isActive, onClick }: { label: string, isActive: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '0.75rem 1rem',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? '3px solid #166534' : '3px solid transparent',
                color: isActive ? '#166534' : '#64748b',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
            }}
        >
            {label}
        </button>
    );
}

function CompanyProfileSettings() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>Company Details</h3>
            <InputGroup label="Company Name" placeholder="e.g. Acme Innovations Ltd." />
            <InputGroup label="Tax Identification Number (TIN)" placeholder="e.g. 12345678-0001" />
            <InputGroup label="Registered Address" placeholder="123 Lagos Avenue, Ikeja" type="textarea" />
            <InputGroup label="Contact Email" placeholder="finance@acme.com" />
            <button style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save Changes</button>
        </div>
    );
}

function TaxYearSettings() {
    return (
        <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Tax Base Periods</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Define the start and end dates for your financial years to ensure correct tax apportionment.</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '0.75rem' }}>Tax Year</th>
                        <th style={{ padding: '0.75rem' }}>Start Date</th>
                        <th style={{ padding: '0.75rem' }}>End Date</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>2025</td>
                        <td style={{ padding: '0.75rem' }}>01 Jan 2025</td>
                        <td style={{ padding: '0.75rem' }}>31 Dec 2025</td>
                        <td style={{ padding: '0.75rem' }}><span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>Active</span></td>
                    </tr>
                </tbody>
            </table>
            <button style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>+ Add New Tax Year</button>
        </div>
    );
}

function CategorySettings() {
    return (
        <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Chart of Accounts (Categories)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                    <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#15803d' }}>Income</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {['Sales', 'Consulting Fees', 'Interest Income', 'Other Income'].map(c => (
                            <li key={c} style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>{c}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#b91c1c' }}>Expenses</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {['Rent', 'Salaries', 'Utilities', 'Office Supplies', 'Bank Charges'].map(c => (
                            <li key={c} style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>{c}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <button style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', background: '#0f172a', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Manage Categories</button>
        </div>
    );
}

function AutoCatRules() {
    return (
        <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Automation Rules</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Automatically apply categories and tags based on transaction descriptions.</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '0.75rem' }}>If Description Contains...</th>
                        <th style={{ padding: '0.75rem' }}>Then Set Category</th>
                        <th style={{ padding: '0.75rem' }}>And Set Tag</th>
                        <th style={{ padding: '0.75rem' }}></th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem' }}>"NEPA" or "EKEDC"</td>
                        <td style={{ padding: '0.75rem' }}>Utilities</td>
                        <td style={{ padding: '0.75rem' }}><span style={{ color: '#b91c1c', background: '#fee2e2', padding: '2px 8px', borderRadius: '12px' }}>VAT</span></td>
                        <td style={{ padding: '0.75rem', color: '#94a3b8', cursor: 'pointer' }}>🗑️</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem' }}>"FIRS" or "LIRS"</td>
                        <td style={{ padding: '0.75rem' }}>Tax Paid</td>
                        <td style={{ padding: '0.75rem' }}>-</td>
                        <td style={{ padding: '0.75rem', color: '#94a3b8', cursor: 'pointer' }}>🗑️</td>
                    </tr>
                </tbody>
            </table>
            <button style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>+ Add Rule</button>
        </div>
    );
}

function UserRoleSettings() {
    return (
        <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>User Management</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '0.75rem' }}>Name</th>
                        <th style={{ padding: '0.75rem' }}>Email</th>
                        <th style={{ padding: '0.75rem' }}>Role</th>
                        <th style={{ padding: '0.75rem' }}>Last Active</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>Admin User</td>
                        <td style={{ padding: '0.75rem' }}>admin@company.com</td>
                        <td style={{ padding: '0.75rem' }}>Administrator</td>
                        <td style={{ padding: '0.75rem' }}>Just now</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>External Auditor</td>
                        <td style={{ padding: '0.75rem' }}>audit@firm.com</td>
                        <td style={{ padding: '0.75rem' }}>Viewer</td>
                        <td style={{ padding: '0.75rem' }}>2 days ago</td>
                    </tr>
                </tbody>
            </table>
            <button style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', background: '#0f172a', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Invite User</button>
        </div>
    );
}

function InputGroup({ label, placeholder, type = 'text' }: { label: string, placeholder: string, type?: string }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#475569' }}>{label}</label>
            {type === 'textarea' ? (
                <textarea rows={3} placeholder={placeholder} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }} />
            ) : (
                <input type={type} placeholder={placeholder} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            )}
        </div>
    )
}
