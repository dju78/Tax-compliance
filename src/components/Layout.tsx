import { useState } from 'react';
import type { Company } from '../engine/types';
import { HELP_CONTENT } from '../data/helpContent';

interface LayoutProps {
    children: React.ReactNode;
    activeView: string;
    onNavigate: (view: string) => void;
    activeCompanyId?: string;
    companies?: Company[];
    onSwitchCompany?: (id: string) => void;
    onAddCompany?: () => void;
    onLogout?: () => void;
}

export function Layout({
    children,
    activeView,
    onNavigate,
    activeCompanyId,
    companies = [],
    onSwitchCompany,
    onAddCompany,
    onLogout
}: LayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true); // New state for notification badge
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHelpSection, setSelectedHelpSection] = useState<string | null>(null);

    // Filter Help Content
    const filteredHelp = HELP_CONTENT.map(section => ({
        ...section,
        content: section.content.filter(article =>
            article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            article.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    })).filter(section => section.content.length > 0);

    const NavItem = ({ view, label, icon }: { view: string, label: string, icon: string }) => (
        <button
            onClick={() => onNavigate(view)}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                border: 'none',
                background: activeView === view ? '#e0f2fe' : 'transparent',
                color: activeView === view ? '#0284c7' : '#64748b',
                width: '100%',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: activeView === view ? '600' : '400',
                marginBottom: '0.25rem',
                textAlign: 'left'
            }}
        >
            <span>{icon}</span>
            {sidebarOpen && <span>{label}</span>}
        </button>
    );

    return (
        <div style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Sidebar */}
            <aside style={{
                width: sidebarOpen ? '260px' : '72px',
                background: 'white',
                borderRight: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                transition: 'width 0.3s ease',
                flexShrink: 0
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src="/deap-logo.png" alt="DEAP Logo" style={{ height: '40px', objectFit: 'contain' }} />
                    {sidebarOpen && (
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b' }}>DEAP</div>
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Nigeria Tax Automator</div>
                        </div>
                    )}
                </div>

                <nav style={{ flex: 1, padding: '1.5rem 1rem', overflowY: 'auto' }}>
                    <NavItem view="dashboard" label="Dashboard" icon="📊" />
                    <NavItem view="upload" label="Upload Data" icon="📁" />
                    <NavItem view="transactions" label="Transactions" icon="💳" />

                    <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Analysis</div>
                    <NavItem view="analysis_pl" label="Analysis" icon="📈" />

                    <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Compliance</div>
                    <NavItem view="tax_cit" label="Tax Computation" icon="calculator" />
                    <NavItem view="filing_pack" label="Filing Pack" icon="📦" />
                    <NavItem view="reports" label="Reports" icon="📑" />
                    <NavItem view="dividend_vouchers" label="Dividend Vouchers" icon="📜" />

                    <div style={{ margin: '1rem 0 0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>System</div>
                    <NavItem view="settings" label="Settings" icon="⚙️" />

                    <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <button
                            onClick={() => { setHelpOpen(true); setNotificationOpen(false); }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                                border: 'none', background: 'transparent', color: '#64748b', width: '100%',
                                borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500'
                            }}
                        >
                            <span>❓</span>
                            {sidebarOpen && <span>Help & Support</span>}
                        </button>
                        <button
                            onClick={onLogout}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                                border: 'none', background: 'transparent', color: '#ef4444', width: '100%',
                                borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '500'
                            }}
                        >
                            <span>🚪</span>
                            {sidebarOpen && <span>Sign Out</span>}
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100vh', overflow: 'hidden', background: '#f1f5f9' }}>

                {/* Top App Bar */}
                <header style={{ height: '64px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>☰</button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Company:</span>
                            <select
                                value={activeCompanyId}
                                onChange={(e) => {
                                    if (e.target.value === 'ADD_NEW') {
                                        onAddCompany?.();
                                    } else {
                                        onSwitchCompany?.(e.target.value);
                                    }
                                }}
                                style={{ background: 'transparent', border: 'none', fontWeight: '600', fontSize: '0.9rem', color: '#334155', cursor: 'pointer', outline: 'none' }}
                            >
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                                <option disabled>──────────</option>
                                <option value="ADD_NEW">+ Add Company</option>
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f8fafc', padding: '0.4rem 0.75rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Year:</span>
                            <select style={{ background: 'transparent', border: 'none', fontWeight: '600', fontSize: '0.9rem', color: '#334155', cursor: 'pointer', outline: 'none' }}>
                                <option>2025 (Jan-Dec)</option>
                                <option>2024 (Jan-Dec)</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}>
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => { setNotificationOpen(!notificationOpen); setHelpOpen(false); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', position: 'relative' }}
                                title="Notifications"
                            >
                                🔔
                                {hasUnread && <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '8px', height: '8px', background: 'red', borderRadius: '50%' }}></span>}
                            </button>
                            {notificationOpen && (
                                <div style={{
                                    position: 'absolute', top: '150%', right: '0', width: '300px',
                                    background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 50
                                }}>
                                    <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', color: '#334155' }}>Notifications</div>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {/* Hardcoded notifications for now */}
                                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: hasUnread ? '#f8fafc' : 'white' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b' }}>Bank upload completed</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>158 transactions imported</div>
                                        </div>
                                        {/* ... other items can follow suit if dynamic, keeping simple for fix */}
                                        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#1e293b' }}>Items need review</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>5 items need review (VAT/WHT rules)</div>
                                        </div>
                                        {/* ... */}
                                    </div>
                                    <div
                                        onClick={() => { setHasUnread(false); setNotificationOpen(false); }}
                                        style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', color: '#0284c7', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500' }}
                                    >
                                        Mark all as read
                                    </div>
                                </div>
                            )}
                        </div>

                        <div style={{ position: 'relative' }}>
                            {/* Help Button Moved to Sidebar */}
                            {helpOpen && (
                                <div style={{
                                    position: 'fixed', top: '0', right: '0', height: '100vh', width: '400px',
                                    background: 'white', borderLeft: '1px solid #e2e8f0', boxShadow: '-4px 0 15px rgba(0,0,0,0.1)',
                                    zIndex: 100, display: 'flex', flexDirection: 'column'
                                }}>
                                    {/* Drawer Header */}
                                    <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                        <h3 style={{ fontWeight: 'bold', color: '#1e293b', margin: 0 }}>Help & Support</h3>
                                        <button onClick={() => setHelpOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
                                    </div>

                                    {/* Search Bar */}
                                    <div style={{ padding: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                                        <input
                                            type="text"
                                            placeholder="Search help (e.g. VAT, Upload)..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                                        />
                                    </div>

                                    {/* Drawer Content */}
                                    <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                                        {searchTerm ? (
                                            // Search Results
                                            <div>
                                                {filteredHelp.length > 0 ? filteredHelp.map(section => (
                                                    <div key={section.id} style={{ marginBottom: '1.5rem' }}>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{section.title}</div>
                                                        {section.content.map((article, idx) => (
                                                            <div key={idx} style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#0f172a' }}>{article.title}</div>
                                                                <div
                                                                    style={{ fontSize: '0.9rem', color: '#334155', lineHeight: '1.5' }}
                                                                    dangerouslySetInnerHTML={{ __html: article.body as string }}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )) : (
                                                    <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>No results found for "{searchTerm}"</div>
                                                )}
                                            </div>
                                        ) : selectedHelpSection ? (
                                            // Selected Section View
                                            <div>
                                                <button
                                                    onClick={() => setSelectedHelpSection(null)}
                                                    style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer', marginBottom: '1rem', fontWeight: '500' }}
                                                >
                                                    ← Back to Topics
                                                </button>
                                                {HELP_CONTENT.filter(s => s.id === selectedHelpSection).map(section => (
                                                    <div key={section.id}>
                                                        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <span>{section.icon}</span> {section.title}
                                                        </h2>
                                                        {section.content.map((article, idx) => (
                                                            <div key={idx} style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #f1f5f9' }}>
                                                                <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#334155' }}>{article.title}</h4>
                                                                {article.body === 'checklist' ? (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                                        {['Create business profile', 'Pick tax type', 'Select period', 'Add transactions', 'Generate report'].map(item => (
                                                                            <label key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
                                                                                <input type="checkbox" /> {item}
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        style={{ fontSize: '0.9rem', color: '#475569', lineHeight: '1.6' }}
                                                                        dangerouslySetInnerHTML={{ __html: article.body as string }}
                                                                    />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            // Topics List
                                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                                {HELP_CONTENT.map(section => (
                                                    <button
                                                        key={section.id}
                                                        onClick={() => setSelectedHelpSection(section.id)}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '1rem',
                                                            padding: '1rem', width: '100%', textAlign: 'left',
                                                            background: 'white', border: '1px solid #e2e8f0',
                                                            borderRadius: '8px', cursor: 'pointer',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseOver={(e) => e.currentTarget.style.borderColor = '#94a3b8'}
                                                        onMouseOut={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                                                    >
                                                        <span style={{ fontSize: '1.5rem' }}>{section.icon}</span>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: '600', color: '#1e293b' }}>{section.title}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{section.content.length} articles</div>
                                                        </div>
                                                        <span style={{ color: '#cbd5e1' }}>›</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Drawer Footer */}
                                    <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 'bold' }}>Need more help?</div>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            <a href="https://wa.me/2348068421761" target="_blank" style={{ color: '#16a34a', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>WhatsApp (+234 806 842 1761)</a>
                                            <a href="mailto:dju78@yahoo.com" style={{ color: '#0284c7', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Email: dju78@yahoo.com</a>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Scrollable View Area */}
                <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
