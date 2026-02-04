-- ============================================
-- CITIZEN & SCHEMES MODULE SCHEMA
-- Phase 2: Citizen Services & Eligibility
-- ============================================

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE eligibility_status AS ENUM ('eligible', 'possibly_eligible', 'not_eligible');
CREATE TYPE scheme_status AS ENUM ('draft', 'active', 'inactive');
CREATE TYPE application_status AS ENUM ('pending', 'under_review', 'approved', 'rejected');

-- ============================================
-- TABLES
-- ============================================

-- Government Schemes
-- Stores rules and details for each scheme
CREATE TABLE schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    ministry TEXT NOT NULL,
    description TEXT NOT NULL,
    benefits TEXT[] DEFAULT '{}',
    eligibility_criteria JSONB NOT NULL DEFAULT '{}', 
    -- Structure: { "min_age": 18, "max_age": 60, "max_income": 500000, "allowed_occupations": ["farmer", "artisan"], "residence_type": ["rural"] }
    benefit_amount NUMERIC(15, 2), -- Monetary benefit if applicable
    status scheme_status DEFAULT 'draft',
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scheme Applications
-- Tracks citizen applications for schemes
CREATE TABLE scheme_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scheme_id UUID NOT NULL REFERENCES schemes(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    application_data JSONB NOT NULL DEFAULT '{}',
    -- Structure: { "age": 25, "occupation": "farmer", "annual_income": 300000, "state": "Punjab", ... }
    status application_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES user_profiles(id),
    review_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(citizen_id, scheme_id) -- One application per citizen per scheme
);

-- Citizen Inquiries (Ephemeral or Saved)
-- Stores the latest eligibility check data for registered citizens
-- Note: Sensitive data rules apply.
CREATE TABLE citizen_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    age_group TEXT, -- e.g. "18-25", "26-40" (Stored as range to minimize PII specificity if possible, or exact integer)
    -- Requirement says: "Age range", "Annual income range".
    -- Let's store structured data matching the form to support privacy.
    profile_data JSONB DEFAULT '{}', 
    -- Structure: { "age_range": "18-25", "gender": "female", "state": "Delhi", "income_range": "0-2.5L", "occupation": "student" }
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved Schemes for Citizens
CREATE TABLE user_saved_schemes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    scheme_id UUID REFERENCES schemes(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, scheme_id)
);

-- Eligibility Logs (For Audit & Analytics)
-- Aggregated or anonymized logs of what is being checked
CREATE TABLE eligibility_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Nullable for public/anonymous checks if we allow them
    schemes_checked_count INTEGER,
    eligible_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_schemes_status ON schemes(status);
CREATE INDEX idx_schemes_ministry ON schemes(ministry);
CREATE INDEX idx_schemes_created_by ON schemes(created_by);

CREATE INDEX idx_scheme_applications_citizen ON scheme_applications(citizen_id);
CREATE INDEX idx_scheme_applications_scheme ON scheme_applications(scheme_id);
CREATE INDEX idx_scheme_applications_status ON scheme_applications(status);
CREATE INDEX idx_scheme_applications_reviewed_by ON scheme_applications(reviewed_by);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE citizen_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SCHEMES POLICIES
-- ============================================

-- Public and citizens can view only active schemes
CREATE POLICY "Public can view active schemes"
    ON schemes FOR SELECT
    USING (status = 'active');

-- Admins can view all schemes (including drafts and inactive)
CREATE POLICY "Admins can view all schemes"
    ON schemes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Only admins and super_admins can create schemes
CREATE POLICY "Admins can create schemes"
    ON schemes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Only admins and super_admins can update schemes
CREATE POLICY "Admins can update schemes"
    ON schemes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Only super_admins can delete schemes
CREATE POLICY "Super admins can delete schemes"
    ON schemes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================
-- SCHEME APPLICATIONS POLICIES
-- ============================================

-- Citizens can view only their own applications
CREATE POLICY "Citizens view own applications"
    ON scheme_applications FOR SELECT
    USING (
        auth.uid() = citizen_id OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('analyst', 'admin', 'super_admin')
        )
    );

-- Citizens can create applications only for themselves
CREATE POLICY "Citizens can create applications"
    ON scheme_applications FOR INSERT
    WITH CHECK (
        auth.uid() = citizen_id AND
        auth.uid() IS NOT NULL
    );

-- Analysts and admins can view all applications
-- (Already covered in SELECT policy above)

-- Only analysts, admins, and super_admins can update applications (for review)
CREATE POLICY "Analysts can review applications"
    ON scheme_applications FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('analyst', 'admin', 'super_admin')
        )
    );

-- Only super_admins can delete applications
CREATE POLICY "Super admins can delete applications"
    ON scheme_applications FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- CITIZEN PROFILES: Private (Self only)
CREATE POLICY "Users view own profile"
    ON citizen_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
    ON citizen_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users insert own profile"
    ON citizen_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- SAVED SCHEMES: Private (Self only)
CREATE POLICY "Users view saved schemes"
    ON user_saved_schemes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users manage saved schemes"
    ON user_saved_schemes FOR ALL
    USING (auth.uid() = user_id);

-- ELIGIBILITY LOGS: Insert only for users, Read for Admins
CREATE POLICY "Users insert logs"
    ON eligibility_logs FOR INSERT
    WITH CHECK (true); -- Authenticated or Anon (if we support anon)

CREATE POLICY "Admins view logs"
    ON eligibility_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheme_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_schemes_updated_at
    BEFORE UPDATE ON schemes
    FOR EACH ROW
    EXECUTE FUNCTION update_scheme_updated_at();

CREATE TRIGGER update_scheme_applications_updated_at
    BEFORE UPDATE ON scheme_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_scheme_updated_at();

-- Audit trigger for schemes (reuse existing log_audit_action from main schema)
CREATE TRIGGER audit_schemes
    AFTER INSERT OR UPDATE OR DELETE ON schemes
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_action();

-- Audit trigger for scheme applications
CREATE TRIGGER audit_scheme_applications
    AFTER INSERT OR UPDATE OR DELETE ON scheme_applications
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_action();

-- ============================================
-- SAMPLE DATA: SCHEMES
-- ============================================

-- Note: These will be inserted without created_by since we're running as service role
-- In production, admins will create schemes through the UI
INSERT INTO schemes (name, ministry, description, benefits, eligibility_criteria, benefit_amount, status)
VALUES
(
    'PM Kisan Samman Nidhi',
    'Ministry of Agriculture',
    'Income support for all landholding farmer families.',
    ARRAY['₹6000 per year', 'Direct Bank Transfer'],
    '{"allowed_occupations": ["farmer"], "max_income": 800000}',
    6000,
    'active'
),
(
    'PM Awas Yojana (Urban)',
    'Ministry of Housing',
    'Affordable housing for urban poor.',
    ARRAY['Interest subsidy', 'Financial assistance for construction'],
    '{"residence_type": ["urban"], "max_income": 600000}',
    250000,
    'active'
),
(
    'National Scholarship Portal',
    'Ministry of Education',
    'Scholarships for students from minority communities.',
    ARRAY['Tuition fee waiver', 'Maintenance allowance'],
    '{"allowed_occupations": ["student"], "max_income": 250000, "min_age": 16, "max_age": 30}',
    50000,
    'active'
),
(
    'Senior Citizen Savings Scheme',
    'Ministry of Finance',
    'Regular income and tax benefits for seniors.',
    ARRAY['8.2% Interest', 'Tax deduction u/s 80C'],
    '{"min_age": 60}',
    NULL,
    'active'
),
(
    'Start-up India Seed Fund',
    'Ministry of Commerce',
    'Financial assistance to startups for proof of concept.',
    ARRAY['Up to ₹20 Lakhs grant', 'Mentorship'],
    '{"allowed_occupations": ["employed", "unemployed"], "business_idea": true}',
    2000000,
    'active'
);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE schemes IS 'Government schemes and subsidies with eligibility rules';
COMMENT ON TABLE scheme_applications IS 'Citizen applications for schemes with approval workflow';
COMMENT ON COLUMN schemes.eligibility_criteria IS 'JSON structure defining eligibility rules';
COMMENT ON COLUMN scheme_applications.application_data IS 'Citizen-submitted data for eligibility verification';
COMMENT ON COLUMN scheme_applications.status IS 'Application workflow status: pending → under_review → approved/rejected';
