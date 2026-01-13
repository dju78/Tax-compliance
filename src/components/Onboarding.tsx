import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import type { User } from '@supabase/supabase-js';
import type { Company, PersonalProfile } from '../engine/types';

interface OnboardingProps {
    user: User;
    onSelectMode: (mode: 'personal' | 'business', contextId?: string) => void;
}

export function Onboarding({ user, onSelectMode }: OnboardingProps) {
    const [loading, setLoading] = useState(true);
    const [personalProfile, setPersonalProfile] = useState<PersonalProfile | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);

    useEffect(() => {
        const fetchContext = async () => {
            if (!user) return;
            setLoading(true);

            // Fetch Personal Profile
            const { data: profile } = await supabase
                .from('personal_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            // Fetch Companies
            const { data: userCompanies } = await supabase
                .from('companies')
                .select('*')
                .eq('user_id', user.id); // Validated by RLS

            if (profile) setPersonalProfile(profile);
            if (userCompanies) setCompanies(userCompanies);
            setLoading(false);
        };
        fetchContext();
    }, [user]);

    if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading user data...</div>;

    const handlePersonalClick = async () => {
        // If profile exists, go to Personal Dashboard
        if (personalProfile) {
            onSelectMode('personal', personalProfile.id);
        } else {
            // AUTO-CREATE Personal Profile
            try {
                // We just need basic profile to start.
                const { data, error } = await supabase
                    .from('personal_profiles')
                    .upsert([{
                        user_id: user.id,
                        name: user.email?.split('@')[0] || 'User', // Default Name (DB column is 'name')
                        created_at: new Date().toISOString()
                    }], { onConflict: 'user_id' })
                    .select()
                    .maybeSingle();

                if (error) throw error;
                if (data) {
                    onSelectMode('personal', data.id);
                }
            } catch (err: any) {
                console.error("Failed to create profile:", err);
                alert(`Error initializing personal account: ${err.message || 'Unknown error'}`);
            }
        }
    };

    const handleBusinessClick = () => {
        if (companies.length > 0) {
            onSelectMode('business');
        } else {
            // Needs creation
            onSelectMode('business', 'new');
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '4rem auto', textAlign: 'center', fontFamily: 'Inter, sans-serif', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-3rem', right: '1rem' }}>
                <button
                    onClick={async () => await supabase.auth.signOut()}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
                >
                    Not you? Sign Out
                </button>
            </div>

            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '1rem' }}>Welcome to DEAP</h1>
            <p style={{ fontSize: '1.2rem', color: '#64748b', marginBottom: '3rem' }}>How would you like to use DEAP today?</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', padding: '0 1rem' }}>

                {/* Personal Card */}
                <div
                    onClick={handlePersonalClick}
                    style={{
                        background: 'white', padding: '3rem 2rem', borderRadius: '16px',
                        border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>👤</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>Personal Tax (PIT)</h2>
                    <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '2rem' }}>
                        For individuals, employees (PAYE), and self-employed freelancers.
                    </p>
                    <button style={{
                        background: '#0f172a', color: 'white', border: 'none', padding: '0.75rem 2rem',
                        borderRadius: '99px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem'
                    }}>
                        {personalProfile ? 'Open Personal Dashboard' : 'Create Personal Profile'}
                    </button>
                </div>

                {/* Business Card */}
                <div
                    onClick={handleBusinessClick}
                    style={{
                        background: 'white', padding: '3rem 2rem', borderRadius: '16px',
                        border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🏢</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '0.5rem' }}>Business Tax (CIT/VAT)</h2>
                    <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '2rem' }}>
                        For limited liability companies (LTD), NGOs, and corporate entities.
                    </p>
                    <button style={{
                        background: 'white', color: '#0f172a', border: '2px solid #0f172a', padding: '0.75rem 2rem',
                        borderRadius: '99px', fontWeight: '600', cursor: 'pointer', fontSize: '1rem'
                    }}>
                        {companies.length > 0 ? 'Select Company' : 'Create Company'}
                    </button>
                </div>
            </div>
        </div>
    );
}
