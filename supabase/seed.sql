-- ============================================
-- SAMPLE DATA FOR DEVELOPMENT & TESTING
-- Ministry of Finance Platform
-- ============================================

-- ============================================
-- SAMPLE FINANCIAL METRICS (90 days)
-- ============================================

-- Revenue data (daily for last 90 days)
INSERT INTO financial_metrics (metric_name, metric_category, value, unit, fiscal_year, fiscal_quarter, recorded_at, is_public, data_source)
SELECT
    'Daily Tax Revenue',
    'revenue',
    (8500000000 + (random() * 2000000000))::numeric(20,2), -- 8.5-10.5 billion INR
    'INR',
    2025,
    CASE 
        WHEN EXTRACT(MONTH FROM date) IN (4,5,6) THEN 1
        WHEN EXTRACT(MONTH FROM date) IN (7,8,9) THEN 2
        WHEN EXTRACT(MONTH FROM date) IN (10,11,12) THEN 3
        ELSE 4
    END,
    date,
    true,
    'Central Board of Direct Taxes'
FROM generate_series(
    NOW() - INTERVAL '90 days',
    NOW(),
    INTERVAL '1 day'
) AS date;

-- Expenditure data
INSERT INTO financial_metrics (metric_name, metric_category, value, unit, fiscal_year, fiscal_quarter, recorded_at, is_public, data_source)
SELECT
    'Daily Government Expenditure',
    'expenditure',
    (7200000000 + (random() * 1800000000))::numeric(20,2), -- 7.2-9 billion INR
    'INR',
    2025,
    CASE 
        WHEN EXTRACT(MONTH FROM date) IN (4,5,6) THEN 1
        WHEN EXTRACT(MONTH FROM date) IN (7,8,9) THEN 2
        WHEN EXTRACT(MONTH FROM date) IN (10,11,12) THEN 3
        ELSE 4
    END,
    date,
    true,
    'Controller General of Accounts'
FROM generate_series(
    NOW() - INTERVAL '90 days',
    NOW(),
    INTERVAL '1 day'
) AS date;

-- GDP Growth (quarterly)
INSERT INTO financial_metrics (metric_name, metric_category, value, unit, fiscal_year, fiscal_quarter, recorded_at, is_public, data_source)
VALUES
    ('GDP Growth Rate', 'gdp', 7.2, 'Percentage', 2025, 1, NOW() - INTERVAL '270 days', true, 'Ministry of Statistics'),
    ('GDP Growth Rate', 'gdp', 7.5, 'Percentage', 2025, 2, NOW() - INTERVAL '180 days', true, 'Ministry of Statistics'),
    ('GDP Growth Rate', 'gdp', 7.8, 'Percentage', 2025, 3, NOW() - INTERVAL '90 days', true, 'Ministry of Statistics'),
    ('GDP Growth Rate', 'gdp', 8.1, 'Percentage', 2025, 4, NOW(), true, 'Ministry of Statistics');

-- Inflation Rate (monthly)
INSERT INTO financial_metrics (metric_name, metric_category, value, unit, fiscal_year, fiscal_quarter, recorded_at, is_public, data_source)
SELECT
    'Consumer Price Index',
    'inflation',
    (4.5 + (random() * 1.5))::numeric(20,2), -- 4.5-6% inflation
    'Percentage',
    2025,
    CASE 
        WHEN EXTRACT(MONTH FROM date) IN (4,5,6) THEN 1
        WHEN EXTRACT(MONTH FROM date) IN (7,8,9) THEN 2
        WHEN EXTRACT(MONTH FROM date) IN (10,11,12) THEN 3
        ELSE 4
    END,
    date,
    true,
    'Reserve Bank of India'
FROM generate_series(
    NOW() - INTERVAL '90 days',
    NOW(),
    INTERVAL '30 days'
) AS date;

-- Fiscal Deficit
INSERT INTO financial_metrics (metric_name, metric_category, value, unit, fiscal_year, fiscal_quarter, recorded_at, is_public, data_source)
VALUES
    ('Fiscal Deficit', 'deficit', 5.8, 'Percentage of GDP', 2025, 1, NOW() - INTERVAL '270 days', true, 'Ministry of Finance'),
    ('Fiscal Deficit', 'deficit', 5.6, 'Percentage of GDP', 2025, 2, NOW() - INTERVAL '180 days', true, 'Ministry of Finance'),
    ('Fiscal Deficit', 'deficit', 5.4, 'Percentage of GDP', 2025, 3, NOW() - INTERVAL '90 days', true, 'Ministry of Finance'),
    ('Fiscal Deficit', 'deficit', 5.2, 'Percentage of GDP', 2025, 4, NOW(), true, 'Ministry of Finance');

-- ============================================
-- SAMPLE TREND RESULTS
-- ============================================

INSERT INTO trend_results (metric_name, metric_category, trend_direction, slope, confidence, period_start, period_end, data_points_analyzed, explanation)
VALUES
    ('Daily Tax Revenue', 'revenue', 'upward', 0.0234, 87.5, NOW() - INTERVAL '90 days', NOW(), 90, 'Tax revenue shows a consistent upward trend with 87.5% confidence, indicating strong economic activity and improved compliance.'),
    ('GDP Growth Rate', 'gdp', 'upward', 0.3, 92.3, NOW() - INTERVAL '365 days', NOW(), 4, 'GDP growth rate demonstrates positive momentum across quarters, reflecting robust economic expansion.'),
    ('Consumer Price Index', 'inflation', 'stable', 0.01, 78.2, NOW() - INTERVAL '90 days', NOW(), 3, 'Inflation remains relatively stable within the target range, suggesting effective monetary policy.'),
    ('Fiscal Deficit', 'deficit', 'downward', -0.2, 85.0, NOW() - INTERVAL '365 days', NOW(), 4, 'Fiscal deficit is declining steadily, indicating improved fiscal consolidation efforts.');

-- ============================================
-- SAMPLE AI INSIGHTS
-- ============================================

INSERT INTO ai_insights (title, insight, severity, metric_category, confidence, recommendation)
VALUES
    (
        'Strong Revenue Growth Detected',
        'Tax revenue has increased by 12.3% over the past quarter, significantly outpacing projections. This trend is driven by improved compliance and economic recovery.',
        'low',
        'revenue',
        89.5,
        'Consider allocating surplus revenue to infrastructure development or debt reduction.'
    ),
    (
        'Expenditure Spike in Social Welfare',
        'Government expenditure on social welfare programs has increased by 18% in the last 30 days, which may impact fiscal deficit targets.',
        'medium',
        'expenditure',
        82.3,
        'Review social welfare spending patterns and ensure alignment with budgetary allocations.'
    ),
    (
        'GDP Growth Acceleration',
        'GDP growth rate has accelerated to 8.1% in Q4, exceeding forecasts. Manufacturing and services sectors are primary contributors.',
        'low',
        'gdp',
        91.2,
        'Maintain supportive policies to sustain growth momentum while monitoring inflation risks.'
    ),
    (
        'Inflation Pressure Building',
        'Consumer Price Index shows early signs of upward pressure, particularly in food and fuel categories.',
        'medium',
        'inflation',
        76.8,
        'Coordinate with RBI to monitor inflation trends and consider preemptive policy measures if necessary.'
    );

-- ============================================
-- SAMPLE FORECASTS
-- ============================================

INSERT INTO forecasts (metric_name, metric_category, forecast_date, predicted_value, lower_bound, upper_bound, confidence, model_used)
VALUES
    ('Daily Tax Revenue', 'revenue', NOW() + INTERVAL '30 days', 9800000000, 9200000000, 10400000000, 85.5, 'ARIMA(2,1,2)'),
    ('Daily Tax Revenue', 'revenue', NOW() + INTERVAL '60 days', 10100000000, 9300000000, 10900000000, 82.3, 'ARIMA(2,1,2)'),
    ('Daily Tax Revenue', 'revenue', NOW() + INTERVAL '90 days', 10400000000, 9400000000, 11400000000, 78.9, 'ARIMA(2,1,2)'),
    ('GDP Growth Rate', 'gdp', NOW() + INTERVAL '90 days', 8.3, 7.8, 8.8, 88.2, 'Linear Regression'),
    ('Consumer Price Index', 'inflation', NOW() + INTERVAL '30 days', 5.2, 4.8, 5.6, 79.5, 'Exponential Smoothing');

-- ============================================
-- SAMPLE ANOMALIES
-- ============================================

INSERT INTO anomalies (metric_name, metric_category, detected_at, expected_value, actual_value, deviation, severity, explanation)
VALUES
    (
        'Daily Tax Revenue',
        'revenue',
        NOW() - INTERVAL '15 days',
        9000000000,
        7200000000,
        -20.0,
        'high',
        'Significant drop in tax revenue detected, possibly due to a public holiday or system outage. Requires investigation.'
    ),
    (
        'Daily Government Expenditure',
        'expenditure',
        NOW() - INTERVAL '7 days',
        7800000000,
        11500000000,
        47.4,
        'critical',
        'Unusual spike in government expenditure detected. This may be related to emergency relief disbursement or a data entry error.'
    ),
    (
        'Consumer Price Index',
        'inflation',
        NOW() - INTERVAL '30 days',
        5.0,
        6.8,
        36.0,
        'medium',
        'Inflation rate exceeded expected range, primarily driven by food price increases.'
    );

-- ============================================
-- SAMPLE SYSTEM CONFIGURATION
-- ============================================

INSERT INTO system_config (config_key, config_value, description, is_active)
VALUES
    ('ai_analysis_enabled', '{"enabled": true, "modules": ["trends", "forecasts", "anomalies", "insights"]}', 'Enable/disable AI analysis modules', true),
    ('data_retention_days', '{"metrics": 1825, "audit_logs": 2555, "ai_outputs": 365}', 'Data retention policies in days (5 years for metrics, 7 years for audit logs, 1 year for AI outputs)', true),
    ('public_dashboard_refresh_interval', '{"seconds": 300}', 'Auto-refresh interval for public dashboard in seconds', true),
    ('anomaly_detection_threshold', '{"z_score": 3.0, "severity_mapping": {"low": 2.0, "medium": 2.5, "high": 3.0, "critical": 3.5}}', 'Anomaly detection sensitivity thresholds', true),
    ('forecast_horizon_days', '{"default": 90, "max": 365}', 'Forecasting time horizon configuration', true);

-- ============================================
-- SAMPLE AUDIT LOGS
-- ============================================

-- Note: In production, audit logs are automatically generated via triggers
-- These are sample entries for demonstration

INSERT INTO audit_logs (user_email, user_role, action, resource_type, resource_id, details)
VALUES
    ('admin@finance.gov.in', 'admin', 'login', 'auth', NULL, '{"ip": "10.0.1.100", "timestamp": "2026-02-02T09:00:00Z"}'),
    ('analyst@finance.gov.in', 'analyst', 'read', 'financial_metrics', NULL, '{"query": "revenue_trends", "filters": {"category": "revenue", "days": 90}}'),
    ('admin@finance.gov.in', 'admin', 'update', 'user_profiles', NULL, '{"action": "role_change", "target_user": "analyst2@finance.gov.in", "new_role": "analyst"}'),
    ('superadmin@finance.gov.in', 'super_admin', 'config_change', 'system_config', NULL, '{"config_key": "ai_analysis_enabled", "old_value": false, "new_value": true}');

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Uncomment to verify data insertion

-- SELECT COUNT(*) as total_metrics FROM financial_metrics;
-- SELECT metric_category, COUNT(*) as count FROM financial_metrics GROUP BY metric_category;
-- SELECT * FROM trend_results;
-- SELECT * FROM ai_insights;
-- SELECT * FROM forecasts;
-- SELECT * FROM anomalies;
-- SELECT * FROM system_config;
-- SELECT COUNT(*) as total_audit_logs FROM audit_logs;
