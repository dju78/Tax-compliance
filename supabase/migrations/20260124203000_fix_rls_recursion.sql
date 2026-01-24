-- Fix infinite recursion in team_members RLS

-- 1. Create a secure function to check membership without triggering RLS
CREATE OR REPLACE FUNCTION get_user_company_ids(user_uuid UUID)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT company_id FROM team_members WHERE user_id = user_uuid AND status = 'active';
$$;

-- 2. Drop the recursive policy on team_members
DROP POLICY IF EXISTS "Users can view team members of their companies" ON team_members;

-- 3. Create the new non-recursive policy for team_members
CREATE POLICY "Users can view team members of their companies"
ON team_members FOR SELECT
USING (
    user_id = auth.uid()
    OR company_id IN ( SELECT get_user_company_ids(auth.uid()) )
);

-- 4. Drop the recursive policies on activity_log
DROP POLICY IF EXISTS "Users can view activity of their companies" ON activity_log;
DROP POLICY IF EXISTS "Users can insert activity logs" ON activity_log;

-- 5. Create new non-recursive policies for activity_log
CREATE POLICY "Users can view activity of their companies"
ON activity_log FOR SELECT
USING (
    company_id IN ( SELECT get_user_company_ids(auth.uid()) )
);

CREATE POLICY "Users can insert activity logs"
ON activity_log FOR INSERT
WITH CHECK (
    company_id IN ( SELECT get_user_company_ids(auth.uid()) )
);

-- Fix auto_add_owner_to_team to bypass RLS for initial member creation
CREATE OR REPLACE FUNCTION auto_add_owner_to_team()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO team_members (
        company_id,
        user_id,
        email,
        role,
        status,
        accepted_at
    ) VALUES (
        NEW.id,
        NEW.user_id,
        (SELECT email FROM auth.users WHERE id = NEW.user_id),
        'owner',
        'active',
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
