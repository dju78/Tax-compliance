import { useState } from 'react';
import { supabase } from '../supabase';

interface PersonalCreateProps {
    userId: string;
    onComplete: (profileId: string) => void;
}

export function PersonalCreate({ userId, onComplete }: PersonalCreateProps) {
    const [name, setName] = useState('');
    const [state, setState] = useState('Lagos');
    const [tin, setTin] = useState('');
    const [nin, setNin] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { data, error } = await supabase
            .from('personal_profiles')
            .insert([{
                user_id: userId,
                name,
                state,
                tin: tin || null,
                nin: nin || null,
                created_at: new Date()
            }])
            .select()
            .single();

        if (error) {
            alert('Error creating profile: ' + error.message);
            setLoading(false);
        } else if (data) {
            onComplete(data.id);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1.5rem', textAlign: 'center' }}>Create Personal Tax Profile</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: '600' }}>Full Legal Name</label>
                    <input
                        required
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. John Doe"
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: '600' }}>State of Residence</label>
                    <select
                        value={state}
                        onChange={e => setState(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' }}
                    >
                        {/* Simplified list */}
                        <option value="Lagos">Lagos</option>
                        <option value="Abuja">Abuja (FCT)</option>
                        <option value="Rivers">Rivers</option>
                        <option value="Ogun">Ogun</option>
                        <option value="Kano">Kano</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: '600' }}>TIN (Optional)</label>
                        <input
                            type="text"
                            value={tin}
                            onChange={e => setTin(e.target.value)}
                            placeholder="Tax ID Number"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: '600' }}>NIN (Optional)</label>
                        <input
                            type="text"
                            value={nin}
                            onChange={e => setNin(e.target.value)}
                            placeholder="National ID"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                        />
                    </div>
                </div>

                <button
                    disabled={loading}
                    type="submit"
                    style={{
                        background: '#0f172a', color: 'white', padding: '1rem', borderRadius: '8px',
                        fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', border: 'none',
                        marginTop: '1rem'
                    }}
                >
                    {loading ? 'Creating...' : 'Create Profile & Continue'}
                </button>
            </form>
        </div>
    );
}
