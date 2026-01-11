import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Auth } from './components/Auth';
import type { Transaction, StatementSummary, Company, FilingChecklist, FilingChecks } from './engine/types';
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
import { Settings } from './components/Settings';
import { autoCategorize } from './engine/autoCat';

import { type AuditInputs } from './engine/auditRisk';
import type { PitInput } from './engine/pit';
import { type CitInput } from './engine/cit';
import { type VatInput } from './engine/vat';

import { DividendVoucherList } from './components/DividendVoucherList';
import { DividendVoucherForm } from './components/DividendVoucherForm';
import { ExpenseChecklist } from './components/ExpenseChecklist';

// ... inside App function
interface CompanySession {
  company: Company;
  statementData: { transactions: Transaction[], summary: StatementSummary } | null;
  pitInput: PitInput;
  citInput: CitInput;
  vatInput: VatInput;
  checklist: FilingChecklist;
  filingChecks: FilingChecks; // New
  expenseChecklist: AuditInputs;
}

// Defaults
const defaultFilingChecks: FilingChecks = {
  company_id: '',
  tax_year_label: '2025',
  bank_reconciled: false,
  expenses_reviewed: false,
  updated_at: new Date()
};

// ...


// Multi-Company State
function App() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    filingChecks: FilingChecks;
    expenseChecklist: AuditInputs;
  }

  const defaultPit: PitInput = { gross_income: 5000000, allowable_deductions: 500000, non_taxable_income: 0, actual_rent_paid: 1000000 };
  const defaultCit: CitInput = { turnover: 120000000, assessable_profit: 30000000 };
  const defaultVat: VatInput = { output_vat: 75000, input_vat: 25000, is_registered: true };
  const defaultChecklist: FilingChecklist = { incomeReconciled: false, expensesReviewed: false, vatReconciled: false, payeCredits: false };
  const defaultExpenseChecklist: AuditInputs = {
    type: 'SOLE',
    turnover: 0,
    selectedItems: [],
    receiptMissing: false,
    noSeparateAccount: false,
    cashOver500k: false,
    noWHT: false,
    repeatedLosses: false,
    suddenSpike: false
  };

  const [activeCompanyId, setActiveCompanyId] = useState<string>('default');
  const [sessions, setSessions] = useState<Record<string, CompanySession>>({
    'default': {
      company: { id: 'default', name: 'Univelcity Ltd' },
      statementData: null,
      pitInput: defaultPit,
      citInput: defaultCit,
      vatInput: defaultVat,
      checklist: defaultChecklist,
      filingChecks: { ...defaultFilingChecks, company_id: 'default' },
      expenseChecklist: defaultExpenseChecklist
    },
    'personal': {
      company: { id: 'personal', name: 'Personal Accounts' },
      statementData: null,
      pitInput: defaultPit,
      citInput: defaultCit,
      vatInput: defaultVat,
      checklist: defaultChecklist,
      filingChecks: { ...defaultFilingChecks, company_id: 'personal' },
      expenseChecklist: defaultExpenseChecklist
    }
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Persistence
  useEffect(() => {
    const saved = localStorage.getItem('deap_sessions');
    if (saved) {
      try {
        const dateFields = ['date', 'period_start', 'period_end', 'date_of_payment', 'created_at', 'opening_balance_date'];
        const parsed = JSON.parse(saved, (key, value) => {
          if (typeof value === 'string' && dateFields.includes(key)) {
            // Simple validation to check if it looks like a date
            if (/^\d{4}-\d{2}-\d{2}/.test(value)) return new Date(value);
          }
          return value;
        });
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSessions(parsed);
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }
    const savedActive = localStorage.getItem('deap_active_id');
    if (savedActive) setActiveCompanyId(savedActive);
  }, []);

  useEffect(() => {
    localStorage.setItem('deap_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('deap_active_id', activeCompanyId);
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

  const setStatementData = (data: { transactions: Transaction[], summary: StatementSummary } | null) =>
    updateSession(s => ({ ...s, statementData: data }));

  const setPitInput = (input: PitInput | ((prev: PitInput) => PitInput)) =>
    updateSession(s => ({ ...s, pitInput: typeof input === 'function' ? input(s.pitInput) : input }));

  const setCitInput = (input: CitInput | ((prev: CitInput) => CitInput)) =>
    updateSession(s => ({ ...s, citInput: typeof input === 'function' ? input(s.citInput) : input }));

  const setVatInput = (input: VatInput | ((prev: VatInput) => VatInput)) =>
    updateSession(s => ({ ...s, vatInput: typeof input === 'function' ? input(s.vatInput) : input }));

  const setChecklist = (input: FilingChecklist | ((prev: FilingChecklist) => FilingChecklist)) =>
    updateSession(s => ({ ...s, checklist: typeof input === 'function' ? input(s.checklist) : input }));

  const setExpenseChecklist = (input: AuditInputs | ((prev: AuditInputs) => AuditInputs)) =>
    updateSession(s => ({ ...s, expenseChecklist: typeof input === 'function' ? input(s.expenseChecklist) : input }));

  const setFilingChecks = (input: FilingChecks | ((prev: FilingChecks) => FilingChecks)) =>
    updateSession(s => ({ ...s, filingChecks: typeof input === 'function' ? input(s.filingChecks) : input }));


  // ...

  const handleAddCompany = () => {
    const name = prompt("Enter new company name:");
    if (!name) return;
    const id = crypto.randomUUID();
    setSessions(prev => ({
      ...prev,
      [id]: {
        company: { id, name, created_at: new Date(), entity_type: 'sole_trader' },
        statementData: null,
        pitInput: defaultPit,
        citInput: defaultCit,
        vatInput: defaultVat,
        checklist: defaultChecklist,
        filingChecks: { ...defaultFilingChecks, company_id: id },
        expenseChecklist: defaultExpenseChecklist,
      }
    }));
    setActiveCompanyId(id);
    setActiveView('dashboard');
  };

  const handleStatementUpload = (data: { transactions: Transaction[], summary: StatementSummary }) => {
    // Inject company_id into transactions & auto-categorize
    const taggedTransactions = data.transactions.map(t => ({
      ...t,
      company_id: activeCompanyId,
      category_name: autoCategorize(t.description) || t.category_name
    }));

    updateSession(s => {
      const existingTxns = s.statementData?.transactions || [];
      const newTxns = [...existingTxns, ...taggedTransactions];

      // Re-calculate Summary
      const total_inflow = newTxns.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);
      const total_outflow = newTxns.filter(t => t.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0);

      const newSummary: StatementSummary = {
        total_inflow,
        total_outflow,
        net_cash_flow: total_inflow - total_outflow,
        transaction_count: newTxns.length,
        period_start: newTxns[0]?.date || new Date(),
        period_end: newTxns[newTxns.length - 1]?.date || new Date()
      };

      return {
        ...s,
        statementData: { transactions: newTxns, summary: newSummary },
        pitInput: {
          ...s.pitInput,
          gross_income: total_inflow,
          allowable_deductions: total_outflow,
        },
        citInput: {
          ...s.citInput,
          turnover: total_inflow,
          assessable_profit: Math.max(0, total_inflow - total_outflow)
        }
      };
    });

    setActiveView('transactions');
  };

  const handleStatementUpdate = (updatedTxns: Transaction[]) => {
    // Correctly updating nested state logic
    if (!activeSession.statementData) return;
    const newData = { ...activeSession.statementData, transactions: updatedTxns };

    // Update session
    const updatedSessions = { ...sessions, [activeCompanyId]: { ...sessions[activeCompanyId], statementData: newData } };
    setSessions(updatedSessions);
    // Also update local view if needed (though session usually drives it)
    setStatementData(newData);
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

      case 'tax_pit': return <TaxPIT transactions={statementData?.transactions || []} savedInput={pitInput} onSave={setPitInput} onNavigate={setActiveView} expenseChecklist={activeSession.expenseChecklist} />;
      case 'tax_cit': return <TaxCIT transactions={statementData?.transactions || []} savedInput={citInput} onSave={setCitInput} onNavigate={setActiveView} expenseChecklist={activeSession.expenseChecklist} />;
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
            filingChecks={activeSession.filingChecks}
            onFilingChecksChange={setFilingChecks}
            onChecklistChange={setChecklist}
            onNavigate={setActiveView}
          />
        ) : <NoDataFallback />;

      case 'settings':
        return <Settings
          company={activeSession.company}
          onUpdateCompany={(updatedCompany) => updateSession(s => ({ ...s, company: updatedCompany }))}
        />;

      case 'expense_checklist':
        return (
          <ExpenseChecklist
            data={activeSession.expenseChecklist}
            onChange={setExpenseChecklist}
          />
        );

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
