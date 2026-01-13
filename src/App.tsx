import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { supabase } from './supabase';
import { Auth } from './components/Auth';
import type { Transaction, StatementSummary, Company, FilingChecklist, FilingChecks } from './engine/types';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { UploadZone } from './components/UploadZone';
import { SmartLedger } from './components/SmartLedger';
import { ProfitLossAnalysis } from './components/ProfitLossAnalysis';
import { TaxPIT } from './components/TaxPIT';
import { TaxCIT } from './components/TaxCIT';
import { TaxVAT } from './components/TaxVAT';
import { TaxCGT } from './components/TaxCGT';
import { TaxWHT } from './components/TaxWHT';
import { TaxYearSplit } from './components/TaxYearSplit';
import { CashFlowStatement } from './components/CashFlowStatement';
import { FilingPack } from './components/FilingPack';
import { Settings } from './components/Settings';
import { DividendVoucherList } from './components/DividendVoucherList';
import { DividendVoucherForm } from './components/DividendVoucherForm';

import { StatementOfAccount } from './components/StatementOfAccount';
import { Onboarding } from './components/Onboarding';
import { PersonalCreate } from './components/PersonalCreate';
import { Help } from './components/Help';
import { Documentation } from './components/Documentation';
import { ExpenseAudit } from './components/ExpenseAudit';
import { TaxSavings } from './components/TaxSavings';

import type { AuditInputs } from './engine/auditRisk';
import type { PitInput } from './engine/pit';
import type { CitInput } from './engine/cit';
import type { CgtInput } from './engine/cgt';
import type { WhtInput } from './engine/wht';
import { calculateVatFromAmount, type VatInput } from './engine/vat';

// Types and Defaults
const defaultFilingChecks: FilingChecks = {
  company_id: '',
  tax_year_label: '2025',
  bank_reconciled: false,
  expenses_reviewed: false,
  updated_at: new Date()
};

const defaultPit: PitInput = { gross_income: 5000000, allowable_deductions: 500000, non_taxable_income: 0, actual_rent_paid: 1000000 };
const defaultCit: CitInput = { turnover: 120000000, assessable_profit: 30000000 };
const defaultCgt: CgtInput = { entity_type: 'company', gain_amount: 0, turnover: 0 };
const defaultWht: WhtInput = { wht_payable: 0, wht_receivable: 0 };
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

interface CompanySession {
  company: Company;
  statementData: { transactions: Transaction[], summary: StatementSummary } | null;
  pitInput: PitInput;
  citInput: CitInput;
  cgtInput: CgtInput;
  whtInput: WhtInput;
  vatInput: VatInput;
  checklist: FilingChecklist;
  filingChecks: FilingChecks;
  expenseChecklist: AuditInputs;
}

// Main App Container
function App() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  if (!user) return <Auth />;

  return (
    <BrowserRouter>
      <AppContent user={user} />
    </BrowserRouter>
  );
}

// Internal Content Wrapper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AppContent({ user }: { user: any }) {
  const navigate = useNavigate();

  // State
  // We maintain 'sessions' as the in-memory DB of loaded company data
  const [sessions, setSessions] = useState<Record<string, CompanySession>>({
    // Initial personal session placeholder
    'personal': {
      company: { id: 'personal', name: 'Personal Accounts', entity_type: 'sole_trader', user_id: 'personal' },
      statementData: null,
      pitInput: defaultPit,
      citInput: defaultCit,
      cgtInput: defaultCgt,
      whtInput: defaultWht,
      vatInput: defaultVat,
      checklist: defaultChecklist,
      filingChecks: { ...defaultFilingChecks, company_id: 'personal' },
      expenseChecklist: defaultExpenseChecklist
    }
  });

  // Active Context State (Derived usually, but stored for API/Persistence)
  const [editingVoucherId, setEditingVoucherId] = useState<string | null>(null);

  // Load Data from Supabase
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      try {
        // 1. Load Personal Profile
        const { data: profile } = await supabase
          .from('personal_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        // 2. Load Companies
        const { data: companies } = await supabase
          .from('companies')
          .select('*')
          .eq('user_id', user.id);

        // 3. Load Filing Status & Transactions
        const [filingRes, txnRes] = await Promise.all([
          supabase.from('filing_status').select('*'),
          // Try to order by txn_date (DB column) if date fails, or just fetch * and sort in JS
          supabase.from('transactions').select('*')
        ]);

        if (filingRes.error) console.error("Error fetching filing status:", filingRes.error);
        if (txnRes.error) console.error("Error fetching transactions:", txnRes.error);

        // Map Filing Status
        const filingStatusMap: Record<string, any> = {};
        if (filingRes.data) {
          filingRes.data.forEach(fs => {
            if (fs.company_id) filingStatusMap[fs.company_id] = fs;
            else if (fs.personal_profile_id) filingStatusMap[fs.personal_profile_id] = fs;
          });
        }

        // Map Transactions
        const txnsByScope: Record<string, Transaction[]> = {};
        if (txnRes.data) {
          // Sort manually since we might have issues with column names in .order()
          const sortedData = (txnRes.data as any[]).sort((a, b) => {
            const dA = new Date(a.txn_date || a.date).getTime();
            const dB = new Date(b.txn_date || b.date).getTime();
            return dA - dB;
          });

          sortedData.forEach((t: any) => {
            const scopeId = t.company_id || t.personal_profile_id;
            if (!scopeId) return;
            if (!txnsByScope[scopeId]) txnsByScope[scopeId] = [];

            // MAP txn_date (DB) to date (Frontend)
            const mappedTxn: Transaction = {
              ...t,
              date: t.txn_date || t.date // Fallback
            };

            txnsByScope[scopeId].push(mappedTxn);
          });
        }

        const newSessions: Record<string, CompanySession> = {};

        // 2a. Init Personal Session
        const profileId = profile?.id || 'personal';
        const personalFilingStatus = filingStatusMap[profileId];
        const pTxns = txnsByScope[profileId] || [];

        let pStatementData = null;
        if (pTxns.length > 0) {
          const inflow = pTxns.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);
          const outflow = pTxns.filter(t => t.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0);
          pStatementData = {
            transactions: pTxns,
            summary: {
              total_inflow: inflow,
              total_outflow: outflow,
              net_cash_flow: inflow - outflow,
              transaction_count: pTxns.length,
              period_start: new Date(pTxns[0].date),
              period_end: new Date(pTxns[pTxns.length - 1].date)
            }
          };
        }

        newSessions['personal'] = {
          company: {
            id: profileId,
            name: profile?.name || profile?.full_name || 'Personal Accounts',
            entity_type: 'sole_trader',
            user_id: user.id,
            address: profile?.address,
            rc_number: profile?.rc_number,
            tin: profile?.tin,
            email: profile?.email,
            business_type: profile?.business_type,
            nin: profile?.nin
          },
          statementData: pStatementData,
          pitInput: personalFilingStatus?.inputs?.pit || defaultPit,
          citInput: personalFilingStatus?.inputs?.cit || defaultCit, // Personal might not have CIT, but keep for type consistency
          cgtInput: personalFilingStatus?.inputs?.cgt || { ...defaultCgt, entity_type: 'individual' },
          whtInput: personalFilingStatus?.inputs?.wht || defaultWht,
          vatInput: personalFilingStatus?.inputs?.vat || defaultVat, // Personal might not have VAT, but keep for type consistency
          checklist: personalFilingStatus?.checklist_data || defaultChecklist,
          filingChecks: { ...defaultFilingChecks, company_id: profileId },
          expenseChecklist: personalFilingStatus?.inputs?.expense || defaultExpenseChecklist
        };

        // 2b. Init Company Sessions
        if (companies) {
          companies.forEach(c => {
            const companyFilingStatus = filingStatusMap[c.id];
            const cTxns = txnsByScope[c.id] || [];

            let cStatementData = null;
            if (cTxns.length > 0) {
              const inflow = cTxns.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);
              const outflow = cTxns.filter(t => t.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0);
              cStatementData = {
                transactions: cTxns,
                summary: {
                  total_inflow: inflow,
                  total_outflow: outflow,
                  net_cash_flow: inflow - outflow,
                  transaction_count: cTxns.length,
                  period_start: new Date(cTxns[0].date),
                  period_end: new Date(cTxns[cTxns.length - 1].date)
                }
              };
            }

            newSessions[c.id] = {
              company: { ...c, name: c.legal_name || c.display_name || 'Unnamed Company' } as Company,
              statementData: cStatementData,
              pitInput: companyFilingStatus?.inputs?.pit || defaultPit, // Company might not have PIT, but keep for type consistency
              citInput: companyFilingStatus?.inputs?.cit || defaultCit,
              cgtInput: companyFilingStatus?.inputs?.cgt || defaultCgt,
              whtInput: companyFilingStatus?.inputs?.wht || defaultWht,
              vatInput: companyFilingStatus?.inputs?.vat || defaultVat,
              checklist: companyFilingStatus?.checklist_data || defaultChecklist,
              filingChecks: { ...defaultFilingChecks, company_id: c.id },
              expenseChecklist: companyFilingStatus?.inputs?.expense || defaultExpenseChecklist
            };
          });
        }

        setSessions(newSessions);

      } catch (e) {
        console.error("Failed to hydrate data:", e);
      }
    };

    loadData();
  }, [user]);

  // Remove localStorage Saver (No-op or rely on specific updaters later)
  // We will persist changes via specific mutation acts, not global state dump.

  // -------------- Helpers ----------------
  const updateSession = (sessionId: string, updater: (prev: CompanySession) => CompanySession) => {
    // This only updates LOCAL state. We need to implement REAL persistence for each slice (transactions, checklist, etc)
    // For Phase 3 (Auth/Routing), specifically for "Create Company", we are protected.
    // For Phase 4 (Data), we will refactor 'updateSession' to call Supabase.
    setSessions(prev => {
      const current = prev[sessionId];
      if (!current) return prev; // Safety
      return {
        ...prev,
        [sessionId]: updater(current)
      };
    });
  };

  const handleCreateCompany = async (name: string) => {
    if (!user) throw new Error("No user");


    // Insert into DB
    const { data, error } = await supabase
      .from('companies')
      .insert([{
        user_id: user.id,
        legal_name: name, // Map to DB column 'legal_name'
        entity_type: 'ltd',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error("Create company error:", error);
      throw error;
    }
    // Map DB response to UI model
    const newCompany = { ...data, name: data.legal_name || data.display_name || name } as Company;

    // Update Local State
    setSessions(prev => ({
      ...prev,
      [newCompany.id]: {
        company: newCompany,
        statementData: null,
        pitInput: defaultPit, citInput: defaultCit, cgtInput: defaultCgt, whtInput: defaultWht, vatInput: defaultVat, checklist: defaultChecklist,
        filingChecks: { ...defaultFilingChecks, company_id: newCompany.id },
        expenseChecklist: defaultExpenseChecklist
      }
    }));
    return newCompany.id;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };


  // -------------- Components for Routes ----------------

  const RouteWrapper = ({ mode }: { mode: 'personal' | 'business' }) => {
    const params = useParams();
    const currentId = params.companyId || 'personal';

    // Safety check for business mode
    if (mode === 'business' && !params.companyId) {
      return <Navigate to="/companies/select" replace />;
    }

    if (!sessions[currentId] && mode === 'business') {
      // Fallback if ID invalid, redirect
      return <Navigate to="/companies/select" replace />;
    }

    const session = sessions[currentId] || sessions['personal']; // Safe access

    // Child Logic Helpers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Persistence Helper
    const persistFiling = async (inputOverrides?: any, checkOverrides?: any) => {
      const s = sessions[currentId];
      const isPersonal = mode === 'personal';
      const realId = s.company.id;

      const inputs = {
        pit: s.pitInput,
        cit: s.citInput,
        cgt: s.cgtInput,
        wht: s.whtInput,
        vat: s.vatInput,
        expense: s.expenseChecklist,
        ...inputOverrides
      };
      const checklist = checkOverrides || s.checklist;

      // determine update payload
      const payload: any = {
        tax_year_label: '2025',
        inputs,
        checklist_data: checklist
      };
      if (isPersonal) payload.personal_profile_id = realId;
      else payload.company_id = realId;

      // Fire & Forget Upsert
      supabase.from('filing_status').upsert(payload, {
        onConflict: isPersonal ? 'personal_profile_id, tax_year_label' : 'company_id, tax_year_label'
      }).then(({ error }) => {
        if (error) console.error("Persist failed", error);
      });
    };

    // Child Logic Helpers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Unified Transaction Updater (recalculates all derived metrics)
    const handleTransactionUpdate = (newTxns: Transaction[]) => {
      const isPersonal = mode === 'personal';
      const s = sessions[currentId];

      // 1. Core Sums
      const total_inflow = newTxns.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);
      const total_outflow_abs = newTxns.filter(t => t.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0);

      // 2. Adjustments
      const nonDeductible = newTxns
        .filter(t => t.amount < 0 && (t.tax_tag === 'Non-deductible' || t.dla_status === 'confirmed' || t.excluded_from_tax))
        .reduce((a, b) => a + Math.abs(b.amount), 0);

      const allowable_deductions = total_outflow_abs - nonDeductible;

      // 3. VAT Logic
      let output_vat = 0;
      let input_vat = 0;

      newTxns.forEach(t => {
        if (t.tax_tag === 'VAT') {
          if (t.amount > 0) output_vat += calculateVatFromAmount(t.amount);
          else input_vat += calculateVatFromAmount(Math.abs(t.amount));
        }
      });

      // 3b. CGT Logic
      const cgtGain = newTxns
        .filter(t => t.tax_tag === 'Capital Gain')
        .reduce((sum, t) => sum + t.amount, 0);

      // 3c. WHT Logic (Simple Estimate based on tags)
      let whtPayable = 0;
      let whtReceivable = 0;
      newTxns.forEach(t => {
        if (t.tax_tag === 'WHT') {
          // 5% default estimation if tagged
          const whtAmount = Math.abs(t.amount) * 0.05;
          if (t.amount < 0) whtPayable += whtAmount; // We paid, so we withheld
          else whtReceivable += whtAmount; // We received, so they withheld
        }
      });

      // 4. Construct Updates
      const newPit = {
        ...(s.pitInput || defaultPit),
        gross_income: total_inflow,
        allowable_deductions: allowable_deductions
      };

      const newCit = {
        ...(s.citInput || defaultCit),
        turnover: total_inflow,
        assessable_profit: Math.max(0, total_inflow - allowable_deductions)
      };

      const newCgt: CgtInput = {
        ...(s.cgtInput || defaultCgt),
        entity_type: isPersonal ? 'individual' : 'company',
        gain_amount: cgtGain,
        turnover: total_inflow // For small company check
      };

      const newWht: WhtInput = {
        ...(s.whtInput || defaultWht),
        wht_payable: whtPayable,
        wht_receivable: whtReceivable
      };

      const newVat = {
        ...(s.vatInput || defaultVat),
        output_vat,
        input_vat
      };

      updateSession(currentId, sess => ({
        ...sess,
        statementData: {
          ...(sess.statementData || { summary: {} as StatementSummary }),
          transactions: newTxns,
          summary: {
            ...(sess.statementData?.summary || {} as StatementSummary),
            total_inflow,
            total_outflow: total_outflow_abs,
            net_cash_flow: total_inflow - total_outflow_abs,
            transaction_count: newTxns.length,
            period_start: sess.statementData?.summary?.period_start || new Date(),
            period_end: sess.statementData?.summary?.period_end || new Date()
          }
        } as any,
        pitInput: newPit,

        citInput: newCit,
        cgtInput: newCgt,
        whtInput: newWht,
        vatInput: newVat
      }));

      persistFiling({ pit: newPit, cit: newCit, cgt: newCgt, wht: newWht, vat: newVat });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setPit = (v: any) => updateSession(currentId, s => {
      const newVal = typeof v === 'function' ? v(s.pitInput) : v;
      persistFiling({ pit: newVal });
      return { ...s, pitInput: newVal };
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setCit = (v: any) => updateSession(currentId, s => {
      const newVal = typeof v === 'function' ? v(s.citInput) : v;
      persistFiling({ cit: newVal });
      return { ...s, citInput: newVal };
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setCgt = (v: any) => updateSession(currentId, s => {
      const newVal = typeof v === 'function' ? v(s.cgtInput) : v;
      persistFiling({ cgt: newVal });
      return { ...s, cgtInput: newVal };
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setWht = (v: any) => updateSession(currentId, s => {
      const newVal = typeof v === 'function' ? v(s.whtInput) : v;
      persistFiling({ wht: newVal });
      return { ...s, whtInput: newVal };
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setVat = (v: any) => updateSession(currentId, s => {
      const newVal = typeof v === 'function' ? v(s.vatInput) : v;
      persistFiling({ vat: newVal });
      return { ...s, vatInput: newVal };
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setChecks = (v: any) => updateSession(currentId, s => {
      const newVal = typeof v === 'function' ? v(s.filingChecks) : v;
      persistFiling(undefined, newVal); // Update checklist
      return { ...s, filingChecks: newVal };
    });


    const handleStatementUpload = async (data: { transactions: Transaction[], summary: StatementSummary }) => {
      // UploadZone now handles persistence. We just update local state.

      // We keep the full 't' (including preview_url) for local session display this run
      const taggedTransactions = data.transactions.map(t => ({
        ...t,
        company_id: mode === 'personal' ? null : session.company.id,
        personal_profile_id: mode === 'personal' ? session.company.id : null,
      }));

      const existingTxns = sessions[currentId].statementData?.transactions || [];
      const newTxns = [...existingTxns, ...taggedTransactions];

      handleTransactionUpdate(newTxns);
      navigate(mode === 'personal' ? '/personal/transactions' : `/companies/${currentId}/transactions`);
    };

    // Filter companies for the dropdown - deduplicate by company ID
    const availableCompanies = Array.from(
      new Map(
        Object.values(sessions)
          .filter(s => s.company.id !== 'personal')
          .map(s => [s.company.id, s.company])
      ).values()
    );

    return (
      <Layout
        mode={mode}
        activeCompanyId={mode === 'business' ? currentId : undefined}
        activeCompanyName={session.company.name}
        companies={availableCompanies}
        onSwitchCompany={(id) => navigate(`/companies/${id}/dashboard`)}
        onAddCompany={() => navigate('/companies/new')}
        onLogout={handleLogout}
        onSwitchMode={(m) => m === 'personal' ? navigate('/personal/dashboard') : navigate('/companies/select')}
      >
        <Routes>
          <Route path="dashboard" element={
            <Dashboard
              summary={session.statementData?.summary || null}
              transactions={session.statementData?.transactions || []}
              onNavigate={(view) => {
                const routeMap: Record<string, string> = {
                  'reports': 'analysis',
                  'settings': 'settings',
                  'upload': 'upload',
                  'transactions': 'transactions',
                  'tax_pit': 'tax/pit',
                  'tax_cit': 'tax/cit',
                  'tax_cgt': 'tax/cgt',
                  'tax_wht': 'tax/wht',
                  'tax_vat': 'tax/vat',
                  'expense_checklist': 'compliance', // Map to compliance view
                  'dividend_vouchers': 'dividends',
                };
                const target = routeMap[view] || view;
                const prefix = mode === 'personal' ? '/personal' : `/companies/${currentId}`;
                navigate(`${prefix}/${target}`);
              }}
            />
          } />
          <Route path="upload" element={
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Upload Data ({mode === 'personal' ? 'Personal' : 'Business'})</h2>
              <UploadZone
                onUpload={handleStatementUpload}
                companyId={session.company.id}
                isPersonal={mode === 'personal'}
              />
            </div>
          } />
          <Route path="transactions" element={
            session.statementData ? (
              <SmartLedger
                transactions={session.statementData.transactions}
                onUpdate={handleTransactionUpdate}
                onSave={async (txn) => {
                  await supabase.from('transactions').update({
                    category_name: txn.category_name,
                    description: txn.description,
                    tax_tag: txn.tax_tag,
                    dla_status: txn.dla_status,
                    // safe to update these if changed
                    amount: txn.amount,
                    txn_date: new Date(txn.date).toISOString() // Map back to DB column
                  }).eq('id', txn.id);
                }}
                onSaveBulk={async (txns) => {
                  const payload = txns.map(t => ({
                    id: t.id,
                    company_id: mode === 'personal' ? null : session.company.id,
                    personal_profile_id: mode === 'personal' ? session.company.id : null,
                    // We only really need to update the changed fields, but upsert needs Primary Key + fields
                    // Safer to map all editable fields
                    category_name: t.category_name,
                    description: t.description,
                    tax_tag: t.tax_tag,
                    dla_status: t.dla_status,
                    amount: t.amount,
                    txn_date: new Date(t.date).toISOString() // Map back to DB column
                  }));
                  await supabase.from('transactions').upsert(payload);
                }}
                onNavigate={(view) => {
                  if (view === 'analysis_pl') navigate(mode === 'personal' ? '/personal/tax/pit' : `/companies/${currentId}/analysis`);
                  else navigate(view);
                }}
              />
            ) : <NoDataFallback mode={mode} />
          } />

          <Route path="analysis" element={
            session.statementData ? (
              <ProfitLossAnalysis
                transactions={session.statementData.transactions}
                onNavigate={(view) => {
                  if (view === 'tax_cit') navigate(mode === 'personal' ? '/personal/tax/pit' : `/companies/${currentId}/tax/cit`);
                  else navigate(view);
                }}
              />
            ) : <NoDataFallback mode={mode} />
          } />
          <Route path="analysis/split" element={<TaxYearSplit transactions={session.statementData?.transactions || []} />} />
          <Route path="analysis/statement" element={<StatementOfAccount transactions={session.statementData?.transactions || []} onUpdate={handleTransactionUpdate} onDownloadExcel={() => { alert('Use the main Filing Pack to download excel'); }} />} />
          <Route path="analysis/cashflow" element={<CashFlowStatement transactions={session.statementData?.transactions || []} />} />
          <Route path="help" element={<Help />} />
          <Route path="docs" element={<Documentation />} />

          {/* Personal Routes */}
          <Route path="tax/pit" element={<TaxPIT savedInput={session.pitInput} onSave={setPit} onNavigate={(view) => {
            if (view === 'filing_pack') navigate(mode === 'personal' ? '/personal/filing' : `/companies/${currentId}/filing`);
            else navigate(view);
          }} expenseChecklist={session.expenseChecklist} />} />
          <Route path="tax/cgt" element={<TaxCGT savedInput={session.cgtInput} entityType="individual" onSave={setCgt} onNavigate={(view) => {
            if (view === 'filing_pack') navigate(mode === 'personal' ? '/personal/filing' : `/companies/${currentId}/filing`);
            else navigate(view);
          }} />} />
          <Route path="tax/wht" element={<TaxWHT transactions={session.statementData?.transactions || []} savedInput={session.whtInput} onSave={setWht} onNavigate={(view) => {
            if (view === 'filing_pack') navigate(mode === 'personal' ? '/personal/filing' : `/companies/${currentId}/filing`);
            else navigate(view);
          }} />} />
          <Route path="compliance" element={<ExpenseAudit companyId={currentId} isPersonal={true} />} />

          {/* Business Routes */}
          <Route path="analysis" element={session.statementData ? (
            <ProfitLossAnalysis
              transactions={session.statementData.transactions}
              onNavigate={(view) => {
                if (view === 'tax_cit') navigate(`/companies/${currentId}/tax/cit`);
                else navigate(view);
              }}
            />
          ) : <NoDataFallback mode={mode} />} />
          <Route path="analysis/split" element={<TaxYearSplit transactions={session.statementData?.transactions || []} />} />
          <Route path="analysis/cashflow" element={<CashFlowStatement transactions={session.statementData?.transactions || []} />} />

          <Route path="tax/cit" element={<TaxCIT transactions={session.statementData?.transactions || []} savedInput={session.citInput} onSave={setCit} onNavigate={(view) => {
            if (view === 'filing_pack') navigate(`/companies/${currentId}/filing`);
            else navigate(view);
          }} expenseChecklist={session.expenseChecklist} />} />
          <Route path="tax/cgt" element={<TaxCGT savedInput={session.cgtInput} entityType="company" onSave={setCgt} onNavigate={(view) => {
            if (view === 'filing_pack') navigate(`/companies/${currentId}/filing`);
            else navigate(view);
          }} />} />
          <Route path="tax/wht" element={<TaxWHT transactions={session.statementData?.transactions || []} savedInput={session.whtInput} onSave={setWht} onNavigate={(view) => {
            if (view === 'filing_pack') navigate(`/companies/${currentId}/filing`);
            else navigate(view);
          }} />} />
          <Route path="tax/vat" element={<TaxVAT transactions={session.statementData?.transactions || []} savedInput={session.vatInput} onSave={setVat} onNavigate={(view) => {
            if (view === 'filing_pack') navigate(`/companies/${currentId}/filing`);
            else navigate(view);
          }} />} />
          <Route path="dividends" element={
            <DividendVoucherList
              companyId={currentId}
              onCreate={() => { setEditingVoucherId(null); navigate('dividends/new'); }}
              onEdit={(id) => { setEditingVoucherId(id); navigate('dividends/edit'); }}
            />
          } />
          <Route path="dividends/new" element={
            <DividendVoucherForm company={session.company} voucherId={null} onSave={() => navigate('..')} onCancel={() => navigate('..')} />
          } />
          <Route path="dividends/edit" element={
            <DividendVoucherForm company={session.company} voucherId={editingVoucherId} onSave={() => navigate('..')} onCancel={() => navigate('..')} />
          } />
          <Route path="compliance" element={<ExpenseAudit companyId={currentId} isPersonal={false} />} />
          <Route path="expense_checklist" element={<ExpenseAudit companyId={currentId} isPersonal={false} />} />

          {/* Shared/Common */}
          <Route path="tax_savings" element={<TaxSavings companyId={currentId} />} />
          <Route path="filing" element={
            <FilingPack
              transactions={session.statementData?.transactions || []}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              summary={session.statementData?.summary || {} as any}
              pitInput={session.pitInput} citInput={session.citInput} cgtInput={session.cgtInput} whtInput={session.whtInput} vatInput={session.vatInput}
              checklist={{} as any}
              filingChecks={session.filingChecks} onFilingChecksChange={setChecks}
              onNavigate={(view) => {
                const routeMap: Record<string, string> = {
                  'transactions': 'transactions',
                  'expense_checklist': 'compliance',
                  'dividend_vouchers': 'dividends',
                };
                const target = routeMap[view] || view;
                const prefix = mode === 'personal' ? '/personal' : `/companies/${currentId}`;
                navigate(`${prefix}/${target}`);
              }}
            />
          } />
          <Route path="settings" element={<Settings company={session.company} onUpdateCompany={(c) => updateSession(currentId, s => ({ ...s, company: c }))} />} />

          <Route path="*" element={<Navigate to={mode === 'personal' ? '/personal/dashboard' : `/companies/${currentId}/dashboard`} replace />} />
        </Routes>
      </Layout>
    );
  };

  const NoDataFallback = ({ mode }: { mode: string }) => (
    <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
      <p>No data uploaded yet.</p>
      <button onClick={() => navigate(mode === 'personal' ? '/personal/upload' : '../upload')} style={{ padding: '0.5rem 1rem', background: '#0f172a', color: 'white', borderRadius: '6px' }}>Upload Data</button>
    </div>
  );

  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding user={user} onSelectMode={(mode, id) => {
        if (mode === 'personal') {
          if (id) navigate('/personal/dashboard');
          else navigate('/personal/create');
        } else {
          if (id === 'new') navigate('/companies/new');
          else navigate('/companies/select');
        }
      }} />} />

      <Route path="/personal/create" element={<PersonalCreate userId={user.id} onComplete={() => navigate('/personal/dashboard')} />} />

      <Route path="/personal/*" element={<RouteWrapper mode="personal" />} />

      <Route path="/companies/select" element={
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
          <h2>Select Company</h2>
          {Array.from(new Map(
            Object.values(sessions)
              .filter(s => s.company.id !== 'personal')
              .map(s => [s.company.id, s])
          ).values()).map(s => (
            <div key={s.company.id} onClick={() => navigate(`/companies/${s.company.id}/upload`)} style={{ padding: '1rem', border: '1px solid #ddd', margin: '0.5rem 0', cursor: 'pointer' }}>
              {s.company.name}
            </div>
          ))}
          <button onClick={() => navigate('/companies/new')} style={{ marginTop: '1rem' }}>+ Create New Company</button>
        </div>
      } />

      <Route path="/companies/new" element={
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
          <h2>Create Company</h2>
          <button onClick={async () => {
            const name = prompt("Company Name?");
            if (name) {
              try {
                console.log("Creating company for user:", user.id);
                const id = await handleCreateCompany(name);
                navigate(`/companies/${id}/upload`);
              } catch (e: any) {
                console.error("Setup error:", e);
                alert(`Failed to create company: ${e.message || e.error_description || JSON.stringify(e)}`);
              }
            }
          }}>Start Setup</button>
        </div>
      } />

      <Route path="/companies/:companyId/*" element={<RouteWrapper mode="business" />} />

      <Route path="/" element={<Navigate to="/onboarding" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
