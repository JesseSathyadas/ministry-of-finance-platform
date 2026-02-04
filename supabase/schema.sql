-- ============================================
-- MINISTRY OF FINANCE - DATABASE SCHEMA
-- Production-grade schema with RLS policies
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('public_user', 'analyst', 'admin', 'super_admin');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE action_type AS ENUM ('create', 'read', 'update', 'delete', 'login', 'logout', 'export', 'config_change');

-- ============================================
-- TABLES
-- ============================================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'public_user',
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Metrics (Core Data)
CREATE TABLE financial_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_category TEXT NOT NULL, -- revenue, expenditure, gdp, inflation, etc.
    value NUMERIC(20, 2) NOT NULL,
    unit TEXT DEFAULT 'INR', -- Currency or percentage
    fiscal_year INTEGER,
    fiscal_quarter INTEGER CHECK (fiscal_quarter BETWEEN 1 AND 4),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source TEXT,
    is_public BOOLEAN DEFAULT false, -- Public visibility flag
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_financial_metrics_category ON financial_metrics(metric_category);
CREATE INDEX idx_financial_metrics_recorded_at ON financial_metrics(recorded_at);
CREATE INDEX idx_financial_metrics_public ON financial_metrics(is_public);

-- AI Trend Results
CREATE TABLE trend_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_category TEXT,
    trend_direction TEXT NOT NULL, -- upward, downward, stable
    slope NUMERIC(10, 4),
    confidence NUMERIC(5, 2) CHECK (confidence BETWEEN 0 AND 100),
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    data_points_analyzed INTEGER,
    explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_trend_results_category ON trend_results(metric_category);
CREATE INDEX idx_trend_results_created_at ON trend_results(created_at);

-- AI Insights
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    insight TEXT NOT NULL,
    severity severity_level DEFAULT 'low',
    metric_category TEXT,
    confidence NUMERIC(5, 2) CHECK (confidence BETWEEN 0 AND 100),
    recommendation TEXT,
    is_reviewed BOOLEAN DEFAULT false,
    reviewed_by UUID REFERENCES user_profiles(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_severity ON ai_insights(severity);
CREATE INDEX idx_ai_insights_reviewed ON ai_insights(is_reviewed);
CREATE INDEX idx_ai_insights_created_at ON ai_insights(created_at);

-- Forecasts
CREATE TABLE forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_category TEXT,
    forecast_date TIMESTAMP WITH TIME ZONE NOT NULL,
    predicted_value NUMERIC(20, 2) NOT NULL,
    lower_bound NUMERIC(20, 2),
    upper_bound NUMERIC(20, 2),
    confidence NUMERIC(5, 2) CHECK (confidence BETWEEN 0 AND 100),
    model_used TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_forecasts_category ON forecasts(metric_category);
CREATE INDEX idx_forecasts_date ON forecasts(forecast_date);

-- Anomalies
CREATE TABLE anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name TEXT NOT NULL,
    metric_category TEXT,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    expected_value NUMERIC(20, 2),
    actual_value NUMERIC(20, 2),
    deviation NUMERIC(10, 2),
    severity severity_level DEFAULT 'medium',
    explanation TEXT,
    is_investigated BOOLEAN DEFAULT false,
    investigated_by UUID REFERENCES user_profiles(id),
    investigation_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_anomalies_severity ON anomalies(severity);
CREATE INDEX idx_anomalies_investigated ON anomalies(is_investigated);
CREATE INDEX idx_anomalies_detected_at ON anomalies(detected_at);

-- Audit Logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id),
    user_email TEXT,
    user_role user_role,
    action action_type NOT NULL,
    resource_type TEXT, -- table name or resource
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- System Configuration
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key TEXT NOT NULL UNIQUE,
    config_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER PROFILES POLICIES
-- ============================================

-- Helper function to check role without RLS recursion
CREATE OR REPLACE FUNCTION is_admin_or_super()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Admins can view all profiles (using secure function to break recursion)
CREATE POLICY "Admins can view all profiles"
    ON user_profiles FOR SELECT
    USING (is_admin_or_super());

-- Admins can update user profiles
CREATE POLICY "Admins can update profiles"
    ON user_profiles FOR UPDATE
    USING (is_admin_or_super());

-- ============================================
-- FINANCIAL METRICS POLICIES
-- ============================================

-- Public users can view public metrics only
CREATE POLICY "Public users view public metrics"
    ON financial_metrics FOR SELECT
    USING (
        is_public = true OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('analyst', 'admin', 'super_admin')
        )
    );

-- Analysts and above can insert metrics
CREATE POLICY "Analysts can insert metrics"
    ON financial_metrics FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('analyst', 'admin', 'super_admin')
        )
    );

-- Only admins can update metrics
CREATE POLICY "Admins can update metrics"
    ON financial_metrics FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Only super_admins can delete metrics
CREATE POLICY "Super admins can delete metrics"
    ON financial_metrics FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================
-- TREND RESULTS POLICIES
-- ============================================

-- Analysts and above can view trends
CREATE POLICY "Analysts can view trends"
    ON trend_results FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('analyst', 'admin', 'super_admin')
        )
    );

-- AI service can insert trends (via service role key)
CREATE POLICY "Service can insert trends"
    ON trend_results FOR INSERT
    WITH CHECK (true); -- Controlled via service role key

-- ============================================
-- AI INSIGHTS POLICIES
-- ============================================

-- Analysts and above can view insights
CREATE POLICY "Analysts can view insights"
    ON ai_insights FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('analyst', 'admin', 'super_admin')
        )
    );

-- AI service can insert insights
CREATE POLICY "Service can insert insights"
    ON ai_insights FOR INSERT
    WITH CHECK (true);

-- Analysts can update review status
CREATE POLICY "Analysts can review insights"
    ON ai_insights FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('analyst', 'admin', 'super_admin')
        )
    );

-- ============================================
-- FORECASTS POLICIES
-- ============================================

-- Analysts and above can view forecasts
CREATE POLICY "Analysts can view forecasts"
    ON forecasts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('analyst', 'admin', 'super_admin')
        )
    );

-- AI service can insert forecasts
CREATE POLICY "Service can insert forecasts"
    ON forecasts FOR INSERT
    WITH CHECK (true);

-- ============================================
-- ANOMALIES POLICIES
-- ============================================

-- Analysts and above can view anomalies
CREATE POLICY "Analysts can view anomalies"
    ON anomalies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('analyst', 'admin', 'super_admin')
        )
    );

-- AI service can insert anomalies
CREATE POLICY "Service can insert anomalies"
    ON anomalies FOR INSERT
    WITH CHECK (true);

-- Analysts can update investigation status
CREATE POLICY "Analysts can investigate anomalies"
    ON anomalies FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('analyst', 'admin', 'super_admin')
        )
    );

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- All authenticated users can insert audit logs (via triggers)
CREATE POLICY "Authenticated users can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- SYSTEM CONFIG POLICIES
-- ============================================

-- Admins can view config
CREATE POLICY "Admins can view config"
    ON system_config FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

-- Only super_admins can modify config
CREATE POLICY "Super admins can modify config"
    ON system_config FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid() AND role = 'super_admin'
        )
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_metrics_updated_at
    BEFORE UPDATE ON financial_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically log actions
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        user_email,
        user_role,
        action,
        resource_type,
        resource_id,
        details
    )
    SELECT
        auth.uid(),
        up.email,
        up.role,
        CASE TG_OP
            WHEN 'INSERT' THEN 'create'::action_type
            WHEN 'UPDATE' THEN 'update'::action_type
            WHEN 'DELETE' THEN 'delete'::action_type
        END,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        jsonb_build_object(
            'operation', TG_OP,
            'old_data', to_jsonb(OLD),
            'new_data', to_jsonb(NEW)
        )
    FROM user_profiles up
    WHERE up.id = auth.uid();
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging to critical tables
CREATE TRIGGER audit_financial_metrics
    AFTER INSERT OR UPDATE OR DELETE ON financial_metrics
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_action();

CREATE TRIGGER audit_system_config
    AFTER INSERT OR UPDATE OR DELETE ON system_config
    FOR EACH ROW
    EXECUTE FUNCTION log_audit_action();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_profiles IS 'Extended user information with role-based access control';
COMMENT ON TABLE financial_metrics IS 'Core financial data with public/private visibility';
COMMENT ON TABLE trend_results IS 'AI-generated trend analysis results';
COMMENT ON TABLE ai_insights IS 'AI-generated insights and recommendations';
COMMENT ON TABLE forecasts IS 'Time-series forecasting data with confidence intervals';
COMMENT ON TABLE anomalies IS 'Detected anomalies requiring investigation';
COMMENT ON TABLE audit_logs IS 'Complete audit trail of all system actions';
COMMENT ON TABLE system_config IS 'System configuration and feature flags';
