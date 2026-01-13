import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function Help() {
    const [showContact, setShowContact] = useState(false);
    const navigate = useNavigate();

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', color: '#334155' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1e293b' }}>Help & Support</h1>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Contact Support</h2>
                <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                    Need assistance with your tax filing? Our support team is here to help.
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setShowContact(true)}
                        style={{ padding: '0.75rem 1.5rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                    >
                        Email Support
                    </button>
                    <button
                        onClick={() => alert("Live chat agents are currently offline. Please use Email Support.")}
                        style={{ padding: '0.75rem 1.5rem', background: 'white', border: '1px solid #cbd5e1', color: '#475569', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                    >
                        Live Chat
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Documentation</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>Read our comprehensive guides on using DEAP.</p>
                    <button onClick={() => navigate('/docs')} style={{ color: '#0f172a', fontWeight: '600', fontSize: '0.9rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Browse Docs →</button>
                </div>
                <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Tax Knowledge Base</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>Learn more about Nigerian Tax calculations.</p>
                    <button onClick={() => navigate('/docs')} style={{ color: '#0f172a', fontWeight: '600', fontSize: '0.9rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>Learn More →</button>
                </div>
            </div>

            {showContact && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', width: '500px', maxWidth: '90%' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Send us a message</h3>
                        <textarea placeholder="Describe your issue..." rows={5} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1rem' }} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button onClick={() => setShowContact(false)} style={{ padding: '0.75rem', border: 'none', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={() => { setShowContact(false); alert("Message sent! We'll reply within 24 hours."); }} style={{ padding: '0.75rem 1.5rem', background: '#166534', color: 'white', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Send Message</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
