import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { DividendVoucher } from '../engine/types';

interface DividendVoucherListProps {
    companyId: string;
    onCreate: () => void;
    onEdit: (id: string) => void;
}

export function DividendVoucherList({ companyId, onCreate, onEdit }: DividendVoucherListProps) {
    const [vouchers, setVouchers] = useState<DividendVoucher[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVouchers();
    }, [companyId]);

    const fetchVouchers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('dividend_vouchers')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching vouchers:', error);
        } else {
            // Parse dates and match type
            const parsed = (data || []).map((d: any) => ({
                ...d,
                date_of_payment: new Date(d.date_of_payment),
                // lines is already json (array)
            })) as DividendVoucher[];
            setVouchers(parsed);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this voucher? This cannot be undone.')) return;

        const { error } = await supabase
            .from('dividend_vouchers')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error deleting voucher: ' + error.message);
        } else {
            setVouchers(prev => prev.filter(v => v.id !== id));
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading vouchers...</div>;
    }

    return (
        <div style={{ padding: '0 2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>Dividend Vouchers</h2>
                    <p style={{ color: '#64748b' }}>Manage dividend distributions and certificates.</p>
                </div>
                <button
                    onClick={onCreate}
                    style={{
                        background: 'var(--color-primary)',
                        color: 'white',
                        border: 'none',
                        padding: '0.6rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}
                >
                    + Create New Voucher
                </button>
            </div>

            <div style={{ background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <tr>
                            <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>VOUCHER NO</th>
                            <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>SHAREHOLDER</th>
                            <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>PAYMENT DATE</th>
                            <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>TAX YEAR</th>
                            <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>GROSS DIVIDEND</th>
                            <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>STATUS</th>
                            <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#64748b', fontWeight: '600', textAlign: 'center' }}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {vouchers.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
                                    No dividend vouchers found. Click "Create New Voucher" to start.
                                </td>
                            </tr>
                        ) : (
                            vouchers.map(v => (
                                <tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.75rem 1rem', fontWeight: '500', color: '#1e293b' }}>{v.voucher_number}</td>
                                    <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>{v.shareholder_name}</td>
                                    <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{v.date_of_payment.toLocaleDateString()}</td>
                                    <td style={{ padding: '0.75rem 1rem', color: '#475569' }}>{v.tax_year_label}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>
                                        {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(v.gross_dividend)}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <span style={{
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '9999px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            background: v.status === 'final' ? '#dcfce7' : '#f1f5f9',
                                            color: v.status === 'final' ? '#166534' : '#64748b'
                                        }}>
                                            {v.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => onEdit(v.id)}
                                                style={{ border: '1px solid #cbd5e1', background: 'white', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', color: '#475569' }}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(v.id)}
                                                style={{ border: '1px solid #fee2e2', background: '#fff1f2', padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', color: '#991b1b' }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
