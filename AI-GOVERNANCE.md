# AI Governance Framework

**Principle:** "Human-in-the-Loop" (HITL)
**AI Role:** Advisory Only

## 1. Governance Rules
1.  **No Automated Decisions:** AI cannot approve budgets, publish reports, or deny citizen applications automatically.
2.  **Advisory Labels:** All AI outputs must be clearly labeled as "Advisory" or "Generated Insight".
3.  **Mandatory Review:** Analysts must explicitly review and approve AI insights before they become part of the official record.

## 2. AI Capabilities & Limits
| Feature | AI Role | Human Role |
| :--- | :--- | :--- |
| **Trend Analysis** | Detect patterns, calculate slopes | Verify data accuracy, understand context |
| **Forecasting** | Project future values based on history | Validate assumptions, approve forecast |
| **Anomaly Detection** | Flag statistical outliers | Investigate root cause, dismiss false positives |
| **Citizen Eligibility** | **NONE** (Rule-based engine used) | Define rules, maintain criteria |

## 3. Algorithm Transparency
- **Trend Detection:** Standard linear regression and statistical forecasting.
- **Explainability:** AI outputs must include a natural language explanation of *why* a result was generated.

## 4. Failure Protocols
- If AI service is unavailable, the platform degrades gracefully to manual mode.
- Core financial functions are **independent** of AI service health.
