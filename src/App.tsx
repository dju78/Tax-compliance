import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Auth } from './components/Auth';
import type { Transaction, StatementSummary, Company, FilingChecklist } from './engine/types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { UploadZone } from './components/UploadZone';
import { SmartLedger } from './components/SmartLedger';
import { ProfitLossAnalysis } from './components/ProfitLossAnalysis';
import { TaxYearSplit } from './components/TaxYearSplit';
import { DirectorLoanAccount } from './components/DirectorLoanAccount';
import { TaxPIT } from './components/TaxPIT';
import { TaxCIT } from './components/TaxCIT';
import { TaxVAT } from './components/TaxVAT';
import { Reports } from './components/Reports';
import { FilingPack } from './components/FilingPack';
import { Settings } from './components/Settings'; // New

// Engine
import type { PitInput } from './engine/pit';
import { type CitInput } from './engine/cit';
import { type VatInput } from './engine/vat';

import { DividendVoucherList } from './components/DividendVoucherList';
import { DividendVoucherForm } from './components/DividendVoucherForm';

// Multi-Company State
function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);

  interface CompanySession {
    company: Company;
    statementData: { transactions: Transaction[], summary: StatementSummary } | null;
    pitInput: PitInput;
    citInput: CitInput;
    vatInput: VatInput;
    checklist: FilingChecklist;
  }

  const defaultPit: PitInput = { gross_income: 5000000, allowable_deductions: 500000, non_taxable_income: 0, actual_rent_paid: 1000000 };
  const defaultCit: CitInput = { turnover: 120000000, assessable_profit: 30000000 };
  const defaultVat: VatInput = { output_vat: 75000, input_vat: 25000, is_registered: true };
  const defaultChecklist: FilingChecklist = { incomeReconciled: false, expensesReviewed: false, vatReconciled: false, payeCredits: false };

  const [activeCompanyId, setActiveCompanyId] = useState<string>('default');
  const [sessions, setSessions] = useState<Record<string, CompanySession>>({
    'default': {
      company: { id: 'default', name: 'Univelcity Ltd' },
      statementData: null,
      pitInput: defaultPit,
      citInput: defaultCit,
      vatInput: defaultVat,
      checklist: defaultChecklist,
    },
    'personal': {
      company: { id: 'personal', name: 'Personal Accounts' },
      statementData: null,
      pitInput: defaultPit,
      citInput: defaultCit,
      vatInput: defaultVat,
      checklist: defaultChecklist,
    }
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadCompanies();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadCompanies();
      } else {
        setLoading(false);
        // Reset sessions on logout
        setSessions({});
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('companies').select('*');
    if (error) {
      console.error('Error loading companies:', error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const newSessions: Record<string, CompanySession> = {};
      data.forEach(company => {
        newSessions[company.id] = {
          company: company,
          statementData: null,
          pitInput: defaultPit,
          citInput: defaultCit,
          vatInput: defaultVat,
          checklist: defaultChecklist,
        };
      });
      setSessions(newSessions);
      setActiveCompanyId(data[0].id);
    } else {
      setSessions({});
      setActiveCompanyId('');
      // Optionally trigger "Add Company" flow?
    }
    setLoading(false);
  };

  // Fetch transactions from DB
  const loadTransactions = async (companyId: string) => {
    const { data, error } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('company_id', companyId)
      .order('txn_date', { ascending: true }); // or date if renamed

    if (error) {
      console.error('Error loading transactions:', error);
      return;
    }

    if (data) {
      const transactions: Transaction[] = data.map((row: any) => ({
        id: row.id,
        company_id: row.company_id,
        date: new Date(row.txn_date || row.date), // Handle mapping
        description: row.description || row.narration,
        amount: Number(row.amount),
        category_name: row.category_name || (Number(row.amount) > 0 ? 'Uncategorized Income' : 'Uncategorized Expense'),
        tax_tag: row.tax_tag,
        notes: row.notes,
        sub_category: row.sub_category,
        is_business: row.is_business,
        excluded_from_tax: row.excluded_from_tax,
        dla_status: row.dla_status || 'none',
        tax_year_label: row.tax_year_label
      }));

      // Calc Summary
      const total_inflow = transactions.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);
      const total_outflow = transactions.filter(t => t.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0);
      const summary: StatementSummary = {
        total_inflow,
        total_outflow,
        net_cash_flow: total_inflow - total_outflow,
        transaction_count: transactions.length,
        period_start: transactions[0]?.date,
        period_end: transactions[transactions.length - 1]?.date
      };

      setSessions(prev => ({
        ...prev,
        [companyId]: {
          ...prev[companyId],
          statementData: { transactions, summary }
        }
      }));
    }
  };

  // Refetch when active company changes
  useEffect(() => {
    if (activeCompanyId && activeCompanyId !== 'default' && activeCompanyId !== 'personal') {
      loadTransactions(activeCompanyId);
    }
  }, [activeCompanyId]);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f1f5f9' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #cbd5e1', borderTopColor: '#0f172a', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const activeSession = sessions[activeCompanyId];

  // Helper setters for active session
  const updateSession = (updater: (prev: CompanySession) => CompanySession) => {
    setSessions(prev => ({
      ...prev,
      [activeCompanyId]: updater(prev[activeCompanyId])
    }));
  };


  const setPitInput = (input: PitInput | ((prev: PitInput) => PitInput)) =>
    updateSession(s => ({ ...s, pitInput: typeof input === 'function' ? input(s.pitInput) : input }));

  const setCitInput = (input: CitInput | ((prev: CitInput) => CitInput)) =>
    updateSession(s => ({ ...s, citInput: typeof input === 'function' ? input(s.citInput) : input }));

  const setVatInput = (input: VatInput | ((prev: VatInput) => VatInput)) =>
    updateSession(s => ({ ...s, vatInput: typeof input === 'function' ? input(s.vatInput) : input }));

  const setChecklist = (input: FilingChecklist | ((prev: FilingChecklist) => FilingChecklist)) =>
    updateSession(s => ({ ...s, checklist: typeof input === 'function' ? input(s.checklist) : input }));



  const handleAddCompany = async () => {
    const name = prompt("Enter new company name:");
    if (!name) return;

    try {
      const { data, error } = await supabase.from('companies').insert([{
        legal_name: name, // Mapped to correct DB column
        profile_type: 'business', // Default
        user_id: user.id // Default works, but explicit is fine too if auth context is correct
      }]).select().single();

      if (error) throw error;

      if (data) {
        // Map DB response back to local type if needed
        const newCompany: Company = {
          ...data,
          name: data.legal_name || data.display_name || name
        };

        setSessions(prev => ({
          ...prev,
          [data.id]: {
            company: newCompany,
            statementData: null,
            pitInput: defaultPit,
            citInput: defaultCit,
            vatInput: defaultVat,
            checklist: defaultChecklist,
          }
        }));
        setActiveCompanyId(data.id);
        setActiveView('dashboard');
      }
    } catch (e: any) {
      console.error('Error adding company:', e);
      alert('Error creating company: ' + e.message);
    }
  };


  const handleStatementUpload = async (data: { transactions: Transaction[], summary: StatementSummary }) => {
    try {
      const rowsToInsert = data.transactions.map(t => ({
        company_id: activeCompanyId,
        user_id: user.id,
        txn_date: t.date.toISOString().split('T')[0], // PG Date
        description: t.description,
        amount: t.amount,
        is_business: true,
        category_name: t.category_name,
        tax_year_label: t.date.getFullYear().toString(),
        dla_status: 'none'
      }));

      const { error } = await supabase.from('bank_transactions').insert(rowsToInsert);
      if (error) throw error;

      alert(`Successfully imported ${rowsToInsert.length} transactions!`);

      // Refresh from DB to get generated IDs etc
      loadTransactions(activeCompanyId);
      setActiveView('transactions');

    } catch (e: any) {
      console.error("Upload error:", e);
      alert("Failed to save transactions: " + e.message);
    }
  };

  // Empty State Check (Placed here to access handleAddCompany)
  if (user && !loading && !activeSession && Object.keys(sessions).length === 0) {
    return (
      <Layout
        activeView="dashboard"
        onNavigate={setActiveView}
        activeCompanyId=""
        companies={[]}
        onSwitchCompany={setActiveCompanyId}
        onAddCompany={handleAddCompany}
        onLogout={handleLogout}
      >
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2>Welcome to DEAP</h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>You don't have any companies yet.</p>
          <button
            onClick={handleAddCompany}
            style={{ padding: '0.75rem 1.5rem', background: '#0f172a', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', cursor: 'pointer' }}
          >
            Create Your First Company
          </button>
        </div>
      </Layout>
    );
  } else if (user && !activeSession) {
    if (Object.keys(sessions).length > 0) {
      // If we have sessions but activeSession is invalid, reset to first
      // Avoid infinite loop if render is fast, but this is a return
      setActiveCompanyId(Object.keys(sessions)[0]);
      return <div>Redirecting...</div>
    }
  }

  const handleStatementUpdate = async (updatedTxns: Transaction[]) => {
    // Optimistic Update
    if (!activeSession.statementData) return;
    const newData = { ...activeSession.statementData, transactions: updatedTxns };

    setSessions(prev => ({
      ...prev,
      [activeCompanyId]: { ...prev[activeCompanyId], statementData: newData }
    }));

    // Background Persistence
    try {
      const rowsToUpsert = updatedTxns.map(t => ({
        id: t.id,
        company_id: t.company_id,
        user_id: user?.id, // Ensure user exists
        txn_date: t.date.toISOString().split('T')[0],
        description: t.description,
        amount: t.amount,
        category_name: t.category_name,
        sub_category: t.sub_category,
        tax_tag: t.tax_tag,
        notes: t.notes,
        dla_status: t.dla_status || 'none',
        is_business: t.is_business,
        excluded_from_tax: t.excluded_from_tax,
        tax_year_label: t.tax_year_label,
        // Preserve category_id if we had it, but mostly we use category_name for now
        // category_id: t.category_id 
      }));

      // Use upsert
      const { error } = await supabase.from('bank_transactions').upsert(rowsToUpsert);
      if (error) {
        console.error("Failed to persist changes:", error);
        // Optionally revert state here if critical
      }
    } catch (e) {
      console.error("Persistence exception:", e);
    }
  };



  // Helper for reused components
  const NoDataFallback = () => (
    <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
      <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No data available for {activeSession.company.name}.</p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          onClick={() => setActiveView('settings')}
          style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', background: 'white' }}
        >
          1. Create Company
        </button>
        <button
          onClick={() => setActiveView('upload')}
          style={{ padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
        >
          2. Upload Data
        </button>
      </div>
    </div>
  );

  const renderContent = () => {
    const { statementData, pitInput, citInput, vatInput, checklist } = activeSession;

    switch (activeView) {
      case 'dashboard':
        return <Dashboard summary={statementData?.summary || null} onNavigate={setActiveView} />;

      case 'upload':
        return (
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '1rem', color: '#1e293b' }}>Upload Bank Statement</h2>
            <UploadZone onUpload={handleStatementUpload} />
          </div>
        );

      case 'transactions':
        return statementData ? (
          <SmartLedger
            transactions={statementData.transactions}
            onUpdate={handleStatementUpdate}
            onNavigate={setActiveView}
          />
        ) : <NoDataFallback />;

      case 'analysis_pl':
        return statementData ? (
          <ProfitLossAnalysis
            transactions={statementData.transactions}
            onNavigate={setActiveView}
          />
        ) : <NoDataFallback />;

      case 'analysis_tax_year': return statementData ? <TaxYearSplit transactions={statementData.transactions} /> : <NoDataFallback />;
      case 'analysis_dla': return statementData ? <DirectorLoanAccount transactions={statementData.transactions} onNavigate={setActiveView} /> : <NoDataFallback />;

      case 'tax_pit': return <TaxPIT transactions={statementData?.transactions || []} savedInput={pitInput} onSave={setPitInput} onNavigate={setActiveView} />;
      case 'tax_cit': return <TaxCIT transactions={statementData?.transactions || []} savedInput={citInput} onSave={setCitInput} onNavigate={setActiveView} />;
      case 'tax_vat': return <TaxVAT transactions={statementData?.transactions || []} savedInput={vatInput} onSave={setVatInput} onNavigate={setActiveView} />;

      case 'dividend_vouchers':
        return (
          <DividendVoucherList
            companyId={activeCompanyId}
            onCreate={() => { setEditingVoucherId(null); setActiveView('dividend_voucher_form'); }}
            onEdit={(id) => { setEditingVoucherId(id); setActiveView('dividend_voucher_form'); }}
          />
        );

      case 'dividend_voucher_form':
        return (
          <DividendVoucherForm
            company={activeSession.company}
            voucherId={editingVoucherId}
            onSave={() => setActiveView('dividend_vouchers')}
            onCancel={() => setActiveView('dividend_vouchers')}
          />
        );

      case 'reports':
        // Switching to Reports component which is more general
        return statementData ? (
          <Reports
            transactions={statementData.transactions}
            summary={statementData.summary}
            pitInput={pitInput}
            citInput={citInput}
            vatInput={vatInput}
          />
        ) : <NoDataFallback />;

      case 'filing_pack': // Keeping FilingPack accessible if needed via explicit route, though default nav goes here
        return statementData ? (
          <FilingPack
            transactions={statementData.transactions}
            summary={statementData.summary}
            pitInput={pitInput}
            citInput={citInput}
            vatInput={vatInput}
            checklist={checklist}
            onChecklistChange={setChecklist}
            onNavigate={setActiveView}
          />
        ) : <NoDataFallback />;

      case 'settings':
        return <Settings
          company={activeSession.company}
          onUpdateCompany={(updatedCompany) => updateSession(s => ({ ...s, company: updatedCompany }))}
        />;

      default: return <div>Under Construction</div>;
    }
  };

  return (
    <Layout
      activeView={activeView}
      onNavigate={setActiveView}
      activeCompanyId={activeCompanyId}
      companies={Object.values(sessions).map(s => s.company)}
      onSwitchCompany={setActiveCompanyId}
      onAddCompany={handleAddCompany}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
