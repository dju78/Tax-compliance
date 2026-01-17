-- Row Level Security Implementation
-- Date: 2026-01-16
-- Description: Implements RLS policies to ensure users can only access their own data

-- ============================================================================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE filing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_years ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. HELPER FUNCTION FOR COMPANY ACCESS CHECK
-- ============================================================================

CREATE OR REPLACE FUNCTION user_has_company_access(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the company belongs to the current user
  RETURN EXISTS (
    SELECT 1 FROM companies
    WHERE id = company_uuid
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. COMPANIES TABLE POLICIES
-- ============================================================================

-- Users can only view their own companies
CREATE POLICY "Users can view own companies"
ON companies FOR SELECT
USING (user_id = auth.uid());

-- Users can only insert companies for themselves
CREATE POLICY "Users can insert own companies"
ON companies FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can only update their own companies
CREATE POLICY "Users can update own companies"
ON companies FOR UPDATE
USING (user_id = auth.uid());

-- Users can only delete their own companies
CREATE POLICY "Users can delete own companies"
ON companies FOR DELETE
USING (user_id = auth.uid());

-- ============================================================================
-- 4. TRANSACTIONS TABLE POLICIES
-- ============================================================================

-- Users can view personal transactions (personal_profile_id is a company they own)
CREATE POLICY "Users can view own personal transactions"
ON transactions FOR SELECT
USING (
  personal_profile_id IS NOT NULL 
  AND user_has_company_access(personal_profile_id)
);

-- Users can view business transactions (company_id is a company they own)
CREATE POLICY "Users can view own company transactions"
ON transactions FOR SELECT
USING (
  company_id IS NOT NULL
  AND user_has_company_access(company_id)
);

-- Users can insert transactions for their own companies/profiles
CREATE POLICY "Users can insert own transactions"
ON transactions FOR INSERT
WITH CHECK (
  (personal_profile_id IS NOT NULL AND user_has_company_access(personal_profile_id))
  OR (company_id IS NOT NULL AND user_has_company_access(company_id))
);

-- Users can update their own transactions
CREATE POLICY "Users can update own transactions"
ON transactions FOR UPDATE
USING (
  (personal_profile_id IS NOT NULL AND user_has_company_access(personal_profile_id))
  OR (company_id IS NOT NULL AND user_has_company_access(company_id))
);

-- Users can delete their own transactions
CREATE POLICY "Users can delete own transactions"
ON transactions FOR DELETE
USING (
  (personal_profile_id IS NOT NULL AND user_has_company_access(personal_profile_id))
  OR (company_id IS NOT NULL AND user_has_company_access(company_id))
);

-- ============================================================================
-- 5. FILING_STATUS TABLE POLICIES
-- ============================================================================

-- Users can view filing status for their own companies/profiles
CREATE POLICY "Users can view own filing status"
ON filing_status FOR SELECT
USING (
  (personal_profile_id IS NOT NULL AND user_has_company_access(personal_profile_id))
  OR (company_id IS NOT NULL AND user_has_company_access(company_id))
);

-- Users can insert filing status for their own companies/profiles
CREATE POLICY "Users can insert own filing status"
ON filing_status FOR INSERT
WITH CHECK (
  (personal_profile_id IS NOT NULL AND user_has_company_access(personal_profile_id))
  OR (company_id IS NOT NULL AND user_has_company_access(company_id))
);

-- Users can update their own filing status
CREATE POLICY "Users can update own filing status"
ON filing_status FOR UPDATE
USING (
  (personal_profile_id IS NOT NULL AND user_has_company_access(personal_profile_id))
  OR (company_id IS NOT NULL AND user_has_company_access(company_id))
);

-- ============================================================================
-- 6. COMPLIANCE_DOCUMENTS TABLE POLICIES
-- ============================================================================

-- Users can view compliance documents for their own companies/profiles
CREATE POLICY "Users can view own compliance documents"
ON compliance_documents FOR SELECT
USING (
  (personal_profile_id IS NOT NULL AND user_has_company_access(personal_profile_id))
  OR (company_id IS NOT NULL AND user_has_company_access(company_id))
);

-- Users can insert compliance documents for their own companies/profiles
CREATE POLICY "Users can insert own compliance documents"
ON compliance_documents FOR INSERT
WITH CHECK (
  (personal_profile_id IS NOT NULL AND user_has_company_access(personal_profile_id))
  OR (company_id IS NOT NULL AND user_has_company_access(company_id))
);

-- Users can update their own compliance documents
CREATE POLICY "Users can update own compliance documents"
ON compliance_documents FOR UPDATE
USING (
  (personal_profile_id IS NOT NULL AND user_has_company_access(personal_profile_id))
  OR (company_id IS NOT NULL AND user_has_company_access(company_id))
);

-- ============================================================================
-- 7. AUDIT_LOGS TABLE POLICIES
-- ============================================================================

-- Users can view audit logs for their own companies (personal audit logs don't have company_id)
CREATE POLICY "Users can view own audit logs"
ON audit_logs FOR SELECT
USING (
  company_id IS NULL  -- Personal audit logs
  OR user_has_company_access(company_id)
);

-- Users can insert audit logs for their own companies
CREATE POLICY "Users can insert own audit logs"
ON audit_logs FOR INSERT
WITH CHECK (
  company_id IS NULL  -- Personal audit logs
  OR user_has_company_access(company_id)
);

-- ============================================================================
-- 8. TAX_YEARS TABLE POLICIES
-- ============================================================================

-- Users can view tax years for their own companies
CREATE POLICY "Users can view own tax years"
ON tax_years FOR SELECT
USING (user_has_company_access(company_id));

-- Users can insert tax years for their own companies
CREATE POLICY "Users can insert own tax years"
ON tax_years FOR INSERT
WITH CHECK (user_has_company_access(company_id));

-- Users can update their own tax years
CREATE POLICY "Users can update own tax years"
ON tax_years FOR UPDATE
USING (user_has_company_access(company_id));

-- Users can delete their own tax years
CREATE POLICY "Users can delete own tax years"
ON tax_years FOR DELETE
USING (user_has_company_access(company_id));

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('transactions', 'companies', 'filing_status');
-- SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- After applying this migration:
-- 1. All queries will automatically filter to user's accessible records
-- 2. Unauthorized access attempts will return empty results
-- 3. Insert/update/delete operations on unauthorized records will fail
-- 4. No client-side filtering is needed for security (but may still be needed for UX)
