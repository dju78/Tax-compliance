import { useState, useEffect } from 'react';
import type { Company } from '../engine/types';
import { supabase } from '../supabase';
import { useUserRole } from '../hooks/useUserRole';
import { hasPermission } from '../engine/rbac';
import { CATEGORY_RULES } from '../engine/autoCat';

interface SettingsProps {
    company: Company;
    onUpdateCompany: (company: Company) => void;
}

export function Settings({ company, onUpdateCompany }: SettingsProps) {
    const { role, loading } = useUserRole();
    const [activeTab, setActiveTab] = useState<'profile' | 'tax_year' | 'categories' | 'rules' | 'users'>('profile');

    // Default to viewer if role missing or null
    const currentRole = role || 'viewer';

    const canReadProfile = hasPermission(currentRole, 'companyProfile', 'read');
    const canReadTax = hasPermission(currentRole, 'taxYears', 'read');
    const canReadCats = hasPermission(currentRole, 'categories', 'read');
    const canReadRules = hasPermission(currentRole, 'autoCategorisation', 'read');
    const canReadUsers = hasPermission(currentRole, 'usersRoles', 'read');

    // Effect to ensure we don't stay on a forbidden tab
    useEffect(() => {
        if (activeTab === 'profile' && !canReadProfile) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            if (canReadTax) setActiveTab('tax_year');
            else if (canReadCats) setActiveTab('categories');
            else if (canReadRules) setActiveTab('rules');
            else if (canReadUsers) setActiveTab('users');
        }
    }, [currentRole, canReadProfile, activeTab, canReadTax, canReadCats, canReadRules, canReadUsers]);

    if (loading) return <div style={{ padding: '2rem' }}>Loading permissions...</div>;

    return (
        <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem' }}>Settings & Configuration</h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem', overflowX: 'auto' }}>
                {canReadProfile && <TabButton label="Company Profile" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />}
                {canReadTax && <TabButton label="Tax Years" isActive={activeTab === 'tax_year'} onClick={() => setActiveTab('tax_year')} />}
                {canReadCats && <TabButton label="Categories" isActive={activeTab === 'categories'} onClick={() => setActiveTab('categories')} />}

                {canReadRules ? (
                    <TabButton label="Auto-Categorisation" isActive={activeTab === 'rules'} onClick={() => setActiveTab('rules')} />
                ) : (
                    <LockedTab label="Auto-Categorisation" />
                )}

                {canReadUsers ? (
                    <TabButton label="Users & Roles" isActive={activeTab === 'users'} onClick={() => setActiveTab('users')} />
                ) : (
                    <LockedTab label="Users & Roles" />
                )}
            </div>

            {/* Content Area */}
            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                {activeTab === 'profile' && canReadProfile && (
                    <CompanyProfileSettings
                        company={company}
                        onSave={onUpdateCompany}
                        canEdit={hasPermission(currentRole, 'companyProfile', 'write')}
                    />
                )}
                {activeTab === 'tax_year' && canReadTax && <TaxYearSettings canEdit={hasPermission(currentRole, 'taxYears', 'write')} />}
                {activeTab === 'categories' && canReadCats && <CategorySettings canEdit={hasPermission(currentRole, 'categories', 'write')} />}
                {activeTab === 'rules' && canReadRules && <AutoCatRules canEdit={hasPermission(currentRole, 'autoCategorisation', 'write')} />}
                {activeTab === 'users' && canReadUsers && <UserRoleSettings canEdit={hasPermission(currentRole, 'usersRoles', 'write')} />}

                {!canReadProfile && activeTab === 'profile' && <div>Access Denied</div>}
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
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
            }}
        >
            {label}
        </button>
    );
}

function LockedTab({ label }: { label: string }) {
    return (
        <div style={{
            padding: '0.75rem 1rem',
            color: '#cbd5e1',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'not-allowed',
            whiteSpace: 'nowrap'
        }}>
            <span>🔒</span>
            <span>{label}</span>
        </div>
    );
}

function CompanyProfileSettings({ company, onSave, canEdit }: { company: Company, onSave: (c: Company) => void, canEdit: boolean }) {
    const [formData, setFormData] = useState<Company>({
        ...company,
        profile_type: company.profile_type || (company.id === 'personal' ? 'individual' : 'business')
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setFormData({
            ...company,
            profile_type: company.profile_type || (company.id === 'personal' ? 'individual' : 'business')
        });
    }, [company]);

    const handleChange = (field: keyof Company, value: string) => {
        if (!canEdit) return; // Prevention
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // Strict Validation
        if (formData.profile_type === 'individual') {
            if (formData.nin && !/^\d{11}$/.test(formData.nin)) {
                newErrors.nin = "NIN must be exactly 11 digits";
            }
            if (formData.tin && !/^\d{10}$/.test(formData.tin)) {
                newErrors.tin = "TIN must be exactly 10 digits";
            }
        } else {
            // Business
            if (formData.rc_number && !/^(RC|BN|IT)/.test(formData.rc_number.toUpperCase())) {
                newErrors.rc_number = "CAC number must start with RC, BN, or IT";
            }
            if (formData.tin && !/^\d{10}$/.test(formData.tin)) {
                newErrors.tin = "TIN must be exactly 10 digits";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!canEdit) return;
        if (!validate()) return;

        setSaving(true);
        try {
            if (formData.id !== 'personal' && formData.id !== 'default') {
                const { error } = await supabase.from('companies').upsert({
                    id: formData.id,
                    legal_name: formData.name, // Mapped to correct DB column
                    address: formData.address,
                    tin: formData.tin,
                    rc_number: formData.rc_number,
                    nin: formData.nin,
                    profile_type: formData.profile_type,
                    business_type: formData.business_type,
                    email: formData.email
                });

                if (error) {
                    if (error.code === '42501') throw new Error("Permission Denied: You do not have rights to update this profile.");
                    throw error;
                }
            } else if (formData.id === 'personal') {
                // Personal Profile Save
                const { error: pError } = await supabase.from('personal_profiles').update({
                    name: formData.name, // Legal Name
                    address: formData.address,
                    tin: formData.tin,
                    nin: formData.nin,
                    email: formData.email,
                    rc_number: formData.rc_number, // BN number if entered
                    business_type: formData.business_type
                }).eq('user_id', (await supabase.auth.getUser()).data.user?.id);

                if (pError) throw pError;
            }

            onSave(formData);
            alert("Profile updated successfully!");
        } catch (e) {
            console.error(e);
            alert("Error saving profile: " + (e instanceof Error ? e.message : String(e)));
        } finally {
            setSaving(false);
        }
    };

    const isIndividual = formData.profile_type === 'individual';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '600px', opacity: canEdit ? 1 : 0.7 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                {isIndividual ? "Individual Profile" : "Business Profile"} {canEdit ? "" : "(Read Only)"}
            </h3>

            {/* Entity Type Toggle (New Source of Truth) */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: canEdit ? 'pointer' : 'default' }}>
                    <input
                        type="radio"
                        name="entity_type"
                        checked={formData.entity_type === 'sole_trader'}
                        onChange={() => handleChange('entity_type', 'sole_trader')}
                        disabled={!canEdit}
                    />
                    Sole Trader (Individual)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: canEdit ? 'pointer' : 'default' }}>
                    <input
                        type="radio"
                        name="entity_type"
                        checked={formData.entity_type === 'ltd'}
                        onChange={() => handleChange('entity_type', 'ltd')}
                        disabled={!canEdit}
                    />
                    Limited Company (LTD)
                </label>
            </div>

            {isIndividual ? (
                <>
                    <InputGroup
                        label="Full Name"
                        value={formData.name}
                        onChange={(v) => handleChange('name', v)}
                        disabled={!canEdit}
                    />
                    <InputGroup
                        label="National Identity Number (NIN)"
                        placeholder="11 digits"
                        value={formData.nin || ''}
                        onChange={(v) => handleChange('nin', v)}
                        error={errors.nin}
                        complianceNote="Sample format shown. Do not enter another person’s identification number."
                        disabled={!canEdit}
                    />
                    <InputGroup
                        label="Tax Identification Number (TIN)"
                        placeholder="10 digits"
                        value={formData.tin || ''}
                        onChange={(v) => handleChange('tin', v)}
                        error={errors.tin}
                        complianceNote="Sample format shown. Do not enter another person’s identification number."
                        disabled={!canEdit}
                    />
                </>
            ) : (
                <>
                    <InputGroup
                        label="Business / Legal Name"
                        value={formData.name}
                        onChange={(v) => handleChange('name', v)}
                        disabled={!canEdit}
                    />
                    <InputGroup
                        label="CAC Registration Number"
                        placeholder="Starts with RC, BN, or IT"
                        value={formData.rc_number || ''}
                        onChange={(v) => handleChange('rc_number', v)}
                        error={errors.rc_number}
                        complianceNote="Sample format shown. Do not enter another person’s identification number."
                        disabled={!canEdit}
                    />
                    <InputGroup
                        label="Tax Identification Number (TIN)"
                        placeholder="10 digits"
                        value={formData.tin || ''}
                        onChange={(v) => handleChange('tin', v)}
                        error={errors.tin}
                        complianceNote="Sample format shown. Do not enter another person’s identification number."
                        disabled={!canEdit}
                    />
                    <InputGroup
                        label="Business Type"
                        placeholder="e.g. Limited Liability, Sole Proprietorship"
                        value={formData.business_type || ''}
                        onChange={(v) => handleChange('business_type', v)}
                        disabled={!canEdit}
                    />
                </>
            )}

            <InputGroup
                label="Registered Address"
                type="textarea"
                value={formData.address || ''}
                onChange={(v) => handleChange('address', v)}
                disabled={!canEdit}
            />
            <InputGroup
                label="Contact Email"
                value={formData.email || ''}
                onChange={(v) => handleChange('email', v)}
                disabled={!canEdit}
            />

            {canEdit && (
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        alignSelf: 'flex-start',
                        padding: '0.75rem 1.5rem',
                        background: saving ? '#94a3b8' : '#0f172a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: saving ? 'wait' : 'pointer'
                    }}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            )}
        </div>
    );
}

function TaxYearSettings({ canEdit }: { canEdit: boolean }) {
    return (
        <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Tax Base Periods {canEdit ? "" : "(Read Only)"}</h3>
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
            {canEdit && <button style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>+ Add New Tax Year</button>}
        </div>
    );
}

function CategorySettings({ canEdit }: { canEdit: boolean }) {
    return (
        <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Chart of Accounts (Categories) {canEdit ? "" : "(Read Only)"}</h3>
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
            {canEdit && <button style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', background: '#0f172a', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Manage Categories</button>}
        </div>
    );
}

function AutoCatRules({ canEdit }: { canEdit: boolean }) {


    return (
        <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Automation Rules {canEdit ? "" : "(Read Only)"}</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>Successfully loaded {Object.keys(CATEGORY_RULES).length} NRS-compliant rules.</p>

            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1 }}>
                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '0.75rem' }}>Category</th>
                            <th style={{ padding: '0.75rem' }}>Keywords (Triggers)</th>
                            <th style={{ padding: '0.75rem' }}>Tax Impact</th>
                            <th style={{ padding: '0.75rem' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.entries(CATEGORY_RULES).map(([category, keywords]) => {
                            let tag = '';
                            let tagColor = '#94a3b8';
                            let tagBg = '#f1f5f9';

                            if (['Utilities', 'Store Supplies', 'Repairs & Maintenance'].includes(category)) { tag = 'VAT'; tagColor = '#b91c1c'; tagBg = '#fee2e2'; }
                            else if (['Professional Fees', 'Rent & Rates', 'Contract'].includes(category)) { tag = 'WHT'; tagColor = '#ca8a04'; tagBg = '#fef9c3'; }
                            else if (category.includes('Director')) { tag = 'AUDIT'; tagColor = '#7c3aed'; tagBg = '#ede9fe'; }

                            return (
                                <tr key={category} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: '500' }}>{category}</td>
                                    <td style={{ padding: '0.75rem', color: '#64748b' }}>{keywords.slice(0, 5).join(', ')}{keywords.length > 5 && '...'}</td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {tag && <span style={{ color: tagColor, background: tagBg, padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', fontWeight: 'bold' }}>{tag}</span>}
                                    </td>
                                    {canEdit && <td style={{ padding: '0.75rem', color: '#94a3b8', cursor: 'pointer' }}>✎</td>}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {canEdit && <button style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>+ Add Rule</button>}
        </div>
    );
}

function UserRoleSettings({ canEdit }: { canEdit: boolean }) {
    return (
        <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>User Management {canEdit ? "" : "(Read Only)"}</h3>
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
            {canEdit && <button style={{ marginTop: '1.5rem', padding: '0.5rem 1rem', background: '#0f172a', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer' }}>Invite User</button>}
        </div>
    );
}

interface InputGroupProps {
    label: string;
    placeholder?: string;
    type?: string;
    value: string;
    onChange: (val: string) => void;
    error?: string;
    complianceNote?: string;
    disabled?: boolean;
}

function InputGroup({ label, placeholder, type = 'text', value, onChange, error, complianceNote, disabled }: InputGroupProps) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '500', color: '#475569' }}>{label}</label>
            {type === 'textarea' ? (
                <textarea
                    rows={3}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: error ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        fontFamily: 'inherit',
                        background: disabled ? '#f8fafc' : 'white',
                        cursor: disabled ? 'not-allowed' : 'text'
                    }}
                />
            ) : (
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={disabled}
                    style={{
                        padding: '0.5rem',
                        borderRadius: '6px',
                        border: error ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        background: disabled ? '#f8fafc' : 'white',
                        cursor: disabled ? 'not-allowed' : 'text'
                    }}
                />
            )}
            {error && <span style={{ fontSize: '0.8rem', color: '#dc2626' }}>{error}</span>}
            {complianceNote && <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>{complianceNote}</span>}
        </div>
    )
}
