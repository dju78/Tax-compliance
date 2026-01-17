-- Team Collaboration & Multi-User Access
-- Date: 2026-01-17
-- Description: Adds team member management, invitations, and activity tracking

-- ============================================================================
-- 1. CREATE TEAM_MEMBERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, user_id),
    UNIQUE(company_id, email)
);

-- Index for faster lookups
CREATE INDEX idx_team_members_company ON team_members(company_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_status ON team_members(status);

-- ============================================================================
-- 2. CREATE ACTIVITY_LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    description TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for activity queries
CREATE INDEX idx_activity_log_company ON activity_log(company_id, created_at DESC);
CREATE INDEX idx_activity_log_user ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_log_type ON activity_log(action_type);

-- ============================================================================
-- 3. CREATE INVITATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
    invited_by UUID NOT NULL REFERENCES auth.users(id),
    invitation_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, email)
);

-- Index for invitation lookups
CREATE INDEX idx_team_invitations_token ON team_invitations(invitation_token);
CREATE INDEX idx_team_invitations_company ON team_invitations(company_id);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);

-- ============================================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Team Members Policies
CREATE POLICY "Users can view team members of their companies"
ON team_members FOR SELECT
USING (
    user_id = auth.uid()
    OR company_id IN (
        SELECT company_id FROM team_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

CREATE POLICY "Owners and admins can insert team members"
ON team_members FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM team_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
);

CREATE POLICY "Owners and admins can update team members"
ON team_members FOR UPDATE
USING (
    company_id IN (
        SELECT company_id FROM team_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
);

CREATE POLICY "Owners can delete team members"
ON team_members FOR DELETE
USING (
    company_id IN (
        SELECT company_id FROM team_members
        WHERE user_id = auth.uid()
        AND role = 'owner'
        AND status = 'active'
    )
);

-- Activity Log Policies
CREATE POLICY "Users can view activity of their companies"
ON activity_log FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM team_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

CREATE POLICY "Users can insert activity logs"
ON activity_log FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM team_members
        WHERE user_id = auth.uid() AND status = 'active'
    )
);

-- Team Invitations Policies
CREATE POLICY "Users can view invitations for their companies"
ON team_invitations FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM team_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Owners and admins can create invitations"
ON team_invitations FOR INSERT
WITH CHECK (
    company_id IN (
        SELECT company_id FROM team_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
);

CREATE POLICY "Owners and admins can update invitations"
ON team_invitations FOR UPDATE
USING (
    company_id IN (
        SELECT company_id FROM team_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
);

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user has specific role in company
CREATE OR REPLACE FUNCTION user_has_role(
    p_company_id UUID,
    p_user_id UUID,
    p_required_role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM team_members
        WHERE company_id = p_company_id
        AND user_id = p_user_id
        AND status = 'active'
        AND CASE p_required_role
            WHEN 'owner' THEN role = 'owner'
            WHEN 'admin' THEN role IN ('owner', 'admin')
            WHEN 'member' THEN role IN ('owner', 'admin', 'member')
            WHEN 'viewer' THEN role IN ('owner', 'admin', 'member', 'viewer')
            ELSE FALSE
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity(
    p_company_id UUID,
    p_action_type TEXT,
    p_description TEXT,
    p_entity_type TEXT DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO activity_log (
        company_id,
        user_id,
        action_type,
        entity_type,
        entity_id,
        description,
        metadata
    ) VALUES (
        p_company_id,
        auth.uid(),
        p_action_type,
        p_entity_type,
        p_entity_id,
        p_description,
        p_metadata
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate invitation token
CREATE OR REPLACE FUNCTION generate_invitation_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Auto-log team member changes
CREATE OR REPLACE FUNCTION log_team_member_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_activity(
            NEW.company_id,
            'team_member_added',
            'Team member ' || NEW.email || ' added with role ' || NEW.role,
            'team_member',
            NEW.id,
            jsonb_build_object('email', NEW.email, 'role', NEW.role)
        );
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.role != NEW.role THEN
            PERFORM log_activity(
                NEW.company_id,
                'team_member_role_changed',
                'Team member ' || NEW.email || ' role changed from ' || OLD.role || ' to ' || NEW.role,
                'team_member',
                NEW.id,
                jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role)
            );
        END IF;
        IF OLD.status != NEW.status THEN
            PERFORM log_activity(
                NEW.company_id,
                'team_member_status_changed',
                'Team member ' || NEW.email || ' status changed to ' || NEW.status,
                'team_member',
                NEW.id,
                jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status)
            );
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_activity(
            OLD.company_id,
            'team_member_removed',
            'Team member ' || OLD.email || ' removed',
            'team_member',
            OLD.id,
            jsonb_build_object('email', OLD.email, 'role', OLD.role)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_team_member_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION log_team_member_changes();

-- ============================================================================
-- 7. INITIAL DATA - Add company owner as team member
-- ============================================================================

-- This will be handled by application logic when creating companies
-- But we can add a trigger to auto-add owner

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
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_add_owner_trigger
    AFTER INSERT ON companies
    FOR EACH ROW
    EXECUTE FUNCTION auto_add_owner_to_team();
