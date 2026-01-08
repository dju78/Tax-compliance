import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { Company, DividendVoucher, DividendVoucherLine } from '../engine/types';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { DividendVoucherPDF } from '../pdf/DividendVoucherPDF';

interface DividendVoucherFormProps {
    company: Company;
    voucherId?: string | null; // ID to fetch if editing
    initialData?: DividendVoucher; // Optional backup or pre-loaded data
    onSave: () => void;
    onCancel: () => void;
}

export function DividendVoucherForm({ company, voucherId, initialData, onSave, onCancel }: DividendVoucherFormProps) {
    // Generate ID and Number default if new
    const isNew = !voucherId && !initialData?.id;
    const defaultId = initialData?.id || crypto.randomUUID();
    const defaultNumber = initialData?.voucher_number || `DIV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(!!voucherId && !initialData);
    const [formData, setFormData] = useState<DividendVoucher>(initialData || {
        id: defaultId,
        company_id: company.id,
        voucher_number: defaultNumber,
        status: 'draft',
        date_of_payment: new Date(),
        tax_year_label: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
        shareholder_name: '',
        shareholder_address: '',
        shares_held: 0,
        share_class: 'Ordinary',
        gross_dividend: 0,
        tax_credit: 0,
        lines: [{ id: crypto.randomUUID(), description: 'Interim Dividend', amount: 0 }],
        authorised_by_name: '',
        authorised_by_role: 'Director',
        received_by_name: ''
    });

    useEffect(() => {
        if (voucherId && !initialData) {
            fetchVoucher(voucherId);
        }
    }, [voucherId]);

    const fetchVoucher = async (id: string) => {
        setLoading(true);
        const { data } = await supabase
            .from('dividend_vouchers')
            .select('*')
            .eq('id', id)
            .single();

        if (data) {
            setFormData({
                ...data,
                date_of_payment: new Date(data.date_of_payment)
            } as DividendVoucher);
        }
        setLoading(false);
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading voucher...</div>;


    const updateField = (field: keyof DividendVoucher, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateLine = (id: string, field: keyof DividendVoucherLine, value: any) => {
        setFormData(prev => {
            const newLines = prev.lines.map(l => l.id === id ? { ...l, [field]: value } : l);
            // Auto-sum
            const total = newLines.reduce((sum, l) => sum + Number(l.amount || 0), 0);
            return { ...prev, lines: newLines, gross_dividend: total };
        });
    };

    const addLine = () => {
        setFormData(prev => ({
            ...prev,
            lines: [...prev.lines, { id: crypto.randomUUID(), description: '', amount: 0 }]
        }));
    };

    const removeLine = (id: string) => {
        setFormData(prev => {
            const newLines = prev.lines.filter(l => l.id !== id);
            const total = newLines.reduce((sum, l) => sum + Number(l.amount || 0), 0);
            return { ...prev, lines: newLines, gross_dividend: total };
        });
    };

    const handleSave = async () => {
        if (!formData.shareholder_name) return alert('Shareholder name required');

        setSaving(true);
        const { error } = await supabase
            .from('dividend_vouchers')
            .upsert({
                ...formData,
                created_at: undefined, // Let DB handle if new, or keep existing? Upsert handles it.
                // Supabase expects Date objects for timestamptz/date columns or ISO strings.
                date_of_payment: formData.date_of_payment,
            });

        setSaving(false);
        if (error) {
            alert('Error saving voucher: ' + error.message);
        } else {
            onSave();
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
                    {isNew ? 'Create Dividend Voucher' : 'Edit Dividend Voucher'}
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={onCancel} style={{ padding: '0.5rem 1rem', border: 'none', background: '#f1f5f9', borderRadius: '6px', cursor: 'pointer', color: '#64748b' }}>Cancel</button>
                    <button onClick={handleSave} disabled={saving} style={{ padding: '0.5rem 1rem', border: 'none', background: saving ? '#94a3b8' : 'var(--color-primary)', color: 'white', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
                        {saving ? 'Saving...' : `Save ${formData.status === 'draft' ? 'Draft' : 'Voucher'}`}
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>Company</label>
                    <input value={company.name} disabled style={{ width: '100%', padding: '0.6rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', color: '#94a3b8' }} />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>Voucher Number</label>
                    <input
                        value={formData.voucher_number}
                        onChange={e => updateField('voucher_number', e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                    />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>Date of Payment</label>
                    <input
                        type="date"
                        value={new Date(formData.date_of_payment).toISOString().split('T')[0]}
                        onChange={e => updateField('date_of_payment', new Date(e.target.value))}
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>Tax Year</label>
                    <input
                        value={formData.tax_year_label}
                        onChange={e => updateField('tax_year_label', e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                    />
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#334155', marginBottom: '1rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '4px' }}>Shareholder Details</h3>
            <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>Shareholder Name (Payee)</label>
                <input
                    value={formData.shareholder_name}
                    onChange={e => updateField('shareholder_name', e.target.value)}
                    placeholder="e.g. John Doe"
                    style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>Address</label>
                    <input
                        value={formData.shareholder_address}
                        onChange={e => updateField('shareholder_address', e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>Shares Held</label>
                    <input
                        type="number"
                        value={formData.shares_held}
                        onChange={e => updateField('shares_held', Number(e.target.value))}
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>Class</label>
                    <select
                        value={formData.share_class}
                        onChange={e => updateField('share_class', e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                    >
                        <option>Ordinary</option>
                        <option>Preference</option>
                        <option>A Ordinary</option>
                        <option>B Ordinary</option>
                    </select>
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#334155', marginBottom: '1rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '4px' }}>Dividend Details</h3>
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                {formData.lines.map((line, idx) => (
                    <div key={line.id} style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                        <div style={{ width: '30px', color: '#94a3b8', fontSize: '0.9rem' }}>#{idx + 1}</div>
                        <input
                            placeholder="Description"
                            value={line.description}
                            onChange={e => updateLine(line.id, 'description', e.target.value)}
                            style={{ flex: 1, padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                        />
                        <input
                            type="number"
                            placeholder="0.00"
                            value={line.amount}
                            onChange={e => updateLine(line.id, 'amount', Number(e.target.value))}
                            style={{ width: '120px', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'right' }}
                        />
                        <button onClick={() => removeLine(line.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}>✕</button>
                    </div>
                ))}
                <button onClick={addLine} style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}>+ Add Line Item</button>

                <div style={{ textAlign: 'right', marginTop: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                    <span style={{ marginRight: '1rem', fontWeight: '600', color: '#64748b' }}>Total Gross Dividend:</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e293b' }}>
                        {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(formData.gross_dividend)}
                    </span>
                </div>
            </div>

            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#334155', marginBottom: '1rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '4px' }}>Authorisation</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>Authorised By (Name)</label>
                    <input
                        value={formData.authorised_by_name || ''}
                        onChange={e => updateField('authorised_by_name', e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.4rem' }}>Role</label>
                    <input
                        value={formData.authorised_by_role || ''}
                        onChange={e => updateField('authorised_by_role', e.target.value)}
                        style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '6px' }}
                    />
                </div>
            </div>

            <div style={{ background: '#f0fdf4', padding: '1rem', border: '1px solid #bbf7d0', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h4 style={{ margin: 0, color: '#166534', fontSize: '1rem' }}>Export PDF</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803d' }}>Preview and download the official voucher.</p>
                </div>

                <PDFDownloadLink
                    document={<DividendVoucherPDF voucher={formData} company={company} />}
                    fileName={`${formData.voucher_number}.pdf`}
                    style={{
                        textDecoration: 'none',
                        padding: '0.6rem 1.2rem',
                        background: '#166534',
                        color: 'white',
                        borderRadius: '6px',
                        fontWeight: '600',
                        fontSize: '0.9rem'
                    }}
                >
                    {/*@ts-ignore*/}
                    {({ blob, url, loading }) =>
                        loading ? 'Generating...' : 'Download PDF'
                    }
                </PDFDownloadLink>
            </div>

        </div>
    );
}
