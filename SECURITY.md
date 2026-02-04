# Security Architecture & Compliance

**Status:** Production Grade | **Audit Level:** High

## 1. Authentication & Authorization
- **Identity Provider:** Supabase Auth (Secure JWTs).
- **RBAC (Role-Based Access Control):** Strictest privilege model.
  - `Public`: Read-only access to specific public pages.
  - `Analyst`: Read/Write to analysis tools, Read-only to core metrics.
  - `Admin`: System management, Audit log viewing. No operational financial access.

## 2. Database Security (RLS)
PostgreSQL Row Level Security is enforced on **ALL** tables.
- `financial_metrics`: Accessible to Analysts/Admins.
- `citizen_profiles`: Restricted to the owning user (`auth.uid() = id`).
- `audit_logs`: Insert-only for system, Read-only for Admins.

## 3. Audit Logging
Every critical action is immutably logged:
- Login/Logout events
- Data modifications
- AI analysis triggers
- Eligibility checks (anonymized stats)

## 4. Infrastructure
- **Encryption:** All data encrypted at rest and in transit (TLS 1.3).
- **API Security:** Rate limiting and input validation (Zod) on all endpoints.
