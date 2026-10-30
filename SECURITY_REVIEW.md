# SECURITY_REVIEW.md — Threat Modeling & Security Controls

Security architecture, threat model, and defense-in-depth posture for the **AI-Powered Sales Funnel Analyzer**.

---

## 1. Threat Modeling (STRIDE Matrix)

| Threat Category | Potential Attack Vector | Mitigating Controls Implemented |
|---|---|---|
| **Spoofing Identity** | Attacker impersonates a Sales Manager or RevOps Admin to view sensitive revenue forecasts. | Strong JWT signing with configurable secrets, strict bearer token verification, expiration bounds, and password hashing using `bcryptjs` with salt rounds. |
| **Tampering with Data** | Attacker tampers with deal conversion stages or alters ML training weights. | Role-Based Access Control (RBAC) middleware verifying roles (`revops_admin` required for model retraining and benchmark modifications). Database input validation and parameterized SQL statements preventing tampering. |
| **Repudiation** | User denies altering pipeline stage or retraining model. | Detailed structured audit logging (`audit_logs` table / console logger) tracking timestamps, actor IDs, actions, and IP addresses. |
| **Information Disclosure** | Unauthenticated users access B2B deal valuations, competitor strategies, or customer contact details. | All `/api/deals`, `/api/pipeline`, `/api/bottlenecks`, `/api/models` routes enforce authentication. Strict CORS policies and Helmet HTTP security headers. |
| **Denial of Service** | Volumetric requests or heavy gradient descent retraining loops crash the API. | Express JSON payload size caps (1MB), rate limiting guards, asynchronous model training with isolated cycles, bounded iteration loops. |
| **Elevation of Privilege** | A `sales_rep` calls administrative retraining or alters organization-wide funnel benchmark targets. | Granular authorization middleware (`requireRole('revops_admin')`). In tests, role escalation attempts explicitly yield `403 Forbidden`. |

---

## 2. Defensive Controls & Hardening

1. **SQL Injection Prevention**:
   - Every database query uses parameterized statements (`node:sqlite` `db.prepare(sql).all(params)` / `db.prepare(sql).run(params)`).
   - Zero dynamic string concatenation in SQL queries.

2. **HTTP Headers & Hygiene**:
   - `helmet` integrated on Express app for X-Content-Type-Options, Strict-Transport-Security, X-Frame-Options (DENY), and X-XSS-Protection.
   - Strict CORS origin filtering for development and production environments.

3. **Machine Learning Model Integrity**:
   - Training datasets require valid historical label flags (`status IN ('WON', 'LOST')`).
   - Feature normalization clips infinite or NaN values before inference.
   - What-if simulations run in sandbox isolation without persisting changes to live deal records unless explicitly committed.

