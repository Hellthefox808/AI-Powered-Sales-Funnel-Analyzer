# DATA_CONTRACTS.md — Data Schemas, API Contracts & ML Specifications

This document defines the strict contracts for the SQLite database schema, REST API endpoints, and Machine Learning feature vectors for the **AI-Powered Sales Funnel Analyzer**.

---

## 1. Relational Database Schema (SQLite `node:sqlite`)

### Table: `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique UUID |
| `name` | TEXT | NOT NULL | User full name |
| `email` | TEXT | UNIQUE NOT NULL | User login email |
| `password_hash` | TEXT | NOT NULL | Bcrypt hash |
| `role` | TEXT | NOT NULL | `revops_admin`, `sales_manager`, `sales_rep` |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | ISO 8601 creation time |

### Table: `accounts`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique UUID |
| `name` | TEXT | NOT NULL | Organization name |
| `domain` | TEXT | NOT NULL | Primary web domain |
| `industry` | TEXT | NOT NULL | e.g. `Fintech`, `Healthcare`, `SaaS`, `Manufacturing` |
| `employee_count` | INTEGER | NOT NULL | Total company employees |
| `annual_revenue` | REAL | NOT NULL | Estimated annual revenue in USD |
| `tier` | TEXT | NOT NULL | `ENTERPRISE`, `MID_MARKET`, `SMB` |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

### Table: `contacts`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique UUID |
| `account_id` | TEXT | FOREIGN KEY -> accounts(id) | Associated account |
| `name` | TEXT | NOT NULL | Contact name |
| `email` | TEXT | NOT NULL | Email address |
| `role_title` | TEXT | NOT NULL | Job title (e.g. VP Engineering, CFO) |
| `seniority` | TEXT | NOT NULL | `C_LEVEL`, `VP`, `DIRECTOR`, `MANAGER`, `INDIVIDUAL` |
| `is_champion` | INTEGER | DEFAULT 0 | 1 if internal champion, 0 otherwise |
| `is_economic_buyer` | INTEGER | DEFAULT 0 | 1 if budget owner, 0 otherwise |

### Table: `deals`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique UUID |
| `account_id` | TEXT | FOREIGN KEY -> accounts(id) | Associated account |
| `title` | TEXT | NOT NULL | Deal title |
| `stage` | TEXT | NOT NULL | `LEAD_CAPTURED`, `QUALIFIED`, `DISCOVERY_CALL`, `PROPOSAL_SENT`, `NEGOTIATION`, `CLOSED_WON`, `CLOSED_LOST` |
| `acv` | REAL | NOT NULL | Annual Contract Value in USD |
| `owner_id` | TEXT | FOREIGN KEY -> users(id) | Assigned sales representative |
| `days_in_stage` | INTEGER | DEFAULT 0 | Elapsed days in the current stage |
| `stage_entered_at` | TEXT | NOT NULL | Timestamp when current stage was entered |
| `status` | TEXT | NOT NULL | `OPEN`, `WON`, `LOST` |
| `loss_reason` | TEXT | NULL | Reason if lost (e.g., `BUDGET`, `COMPETITOR`, `NO_DECISION`, `TIMING`) |
| `competitor` | TEXT | NULL | Named competitor if applicable |
| `discount_pct` | REAL | DEFAULT 0.0 | Discount requested (0.0 to 100.0) |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| `closed_at` | TEXT | NULL | Closed timestamp |

### Table: `interactions`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Unique UUID |
| `deal_id` | TEXT | FOREIGN KEY -> deals(id) | Associated deal |
| `contact_id` | TEXT | FOREIGN KEY -> contacts(id) | Contact interacted with |
| `type` | TEXT | NOT NULL | `EMAIL_SENT`, `EMAIL_OPENED`, `EMAIL_REPLY`, `DEMO_CALL`, `DISCOVERY_CALL`, `PROPOSAL_REVIEW`, `SECURITY_AUDIT`, `EXECUTIVE_SPONSOR_MEETING`, `CONTRACT_REDLINE` |
| `sentiment` | TEXT | NOT NULL | `POSITIVE`, `NEUTRAL`, `NEGATIVE` |
| `notes` | TEXT | NOT NULL | Summary notes |
| `timestamp` | TEXT | NOT NULL | Event occurrence timestamp |

### Table: `ml_models`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Model version UUID |
| `algorithm` | TEXT | NOT NULL | `LOGISTIC_REGRESSION_L2` |
| `parameters_json` | TEXT | NOT NULL | Serialized weights, bias, and z-score scaler state |
| `metrics_json` | TEXT | NOT NULL | Accuracy, ROC-AUC, Log-Loss, Precision, Recall, F1 |
| `training_samples` | INTEGER | NOT NULL | Count of historical deals used |
| `is_active` | INTEGER | DEFAULT 1 | 1 for active production model |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Model creation time |

### Table: `ml_predictions_log`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | TEXT | PRIMARY KEY | Prediction UUID |
| `deal_id` | TEXT | FOREIGN KEY -> deals(id) | Scored deal |
| `model_id` | TEXT | FOREIGN KEY -> ml_models(id) | Model version used |
| `probability` | REAL | NOT NULL | Predicted win probability [0.0, 1.0] |
| `classification` | TEXT | NOT NULL | `HIGH_CONVERSION`, `MEDIUM_RISK`, `LOW_CONVERSION` |
| `factors_json` | TEXT | NOT NULL | Top positive and negative local feature attributions |
| `recommended_action` | TEXT | NOT NULL | Prescriptive Next Best Action |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | Timestamp |

### Table: `funnel_benchmarks`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `stage` | TEXT | PRIMARY KEY | Funnel stage identifier |
| `expected_conversion_pct` | REAL | NOT NULL | Target transition rate to next stage |
| `expected_cycle_days` | REAL | NOT NULL | Expected average days in this stage |
| `max_healthy_days` | REAL | NOT NULL | Threshold before flagged as stalled/bottleneck |

---

## 2. Machine Learning Feature Vector Specification

Input vector $X \in \mathbb{R}^{10}$ engineered from deal and interaction records:

1. `feature_total_interactions`: Count of all logged touches for the deal.
2. `feature_email_reply_ratio`: Ratio of replies to total emails sent ($\in [0.0, 1.0]$).
3. `feature_demo_completed`: Binary flag (1 if demo or discovery occurred, 0 otherwise).
4. `feature_decision_makers_engaged`: Distinct contacts with seniority $\ge \text{DIRECTOR}$.
5. `feature_has_economic_buyer`: Binary flag (1 if contact with `is_economic_buyer = 1` interacted).
6. `feature_days_since_last_touch`: Elapsed days between current date and latest interaction.
7. `feature_deal_size_log`: Natural log of Annual Contract Value ($\ln(\text{ACV})$).
8. `feature_discount_pct`: Requested discount percentage ($0$ to $50$).
9. `feature_account_employee_log`: Natural log of organization size ($\ln(\text{employee\_count})$).
10. `feature_velocity_ratio`: $\frac{\text{expected\_cycle\_days}}{\max(1, \text{days\_in\_stage})}$.

### Classification Thresholds
- **High Conversion**: $P(\text{Win}) \ge 0.70$
- **Medium Risk**: $0.40 \le P(\text{Win}) < 0.70$
- **Low Conversion**: $P(\text{Win}) < 0.40$

---

## 3. REST API Contract

### Authentication & Sessions
- `POST /api/auth/login`
  - Body: `{ email, password }`
  - Response: `{ token, user: { id, name, email, role } }`
- `GET /api/auth/me`
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ user }`

### Pipeline & Funnel Metrics
- `GET /api/pipeline/funnel`
  - Response:
    ```json
    {
      "stages": [
        {
          "stage": "LEAD_CAPTURED",
          "name": "Lead Captured",
          "count": 45,
          "total_value": 1850000,
          "conversion_rate": 0.68,
          "avg_days": 6.2,
          "benchmark_conversion": 0.70,
          "benchmark_days": 5.0,
          "status": "HEALTHY"
        }
      ],
      "overall_conversion_rate": 0.082,
      "total_pipeline_value": 4250000,
      "pipeline_velocity": 47222.22,
      "avg_cycle_days": 42.5
    }
    ```

### Deals & Predictive Scoring
- `GET /api/deals`
  - Query params: `stage`, `owner_id`, `status`
  - Response: `[ { id, title, account, acv, stage, days_in_stage, win_probability, classification, top_factors, next_best_action } ]`
- `GET /api/deals/:id`
  - Response: Full deal details including interaction history timeline and feature breakdown.
- `POST /api/predictions/what-if`
  - Body: `{ deal_id, simulated_touches, add_economic_buyer, change_discount_pct, days_since_touch }`
  - Response: `{ original_probability, simulated_probability, delta_probability, factor_deltas }`

### Bottlenecks & Friction Diagnostics
- `GET /api/bottlenecks`
  - Response:
    ```json
    {
      "active_bottlenecks": [
        {
          "stage": "PROPOSAL_SENT",
          "severity": "HIGH",
          "drop_off_pct": 0.44,
          "benchmark_drop_off": 0.25,
          "avg_days": 18.4,
          "benchmark_days": 10.0,
          "stalled_deals_count": 8,
          "revenue_at_risk": 640000,
          "recommended_playbook": "Trigger multi-threaded stakeholder alignment and security pre-clearance"
        }
      ],
      "total_revenue_at_risk": 1120000
    }
    ```

### ML Model Management
- `GET /api/models/active`
  - Response: `{ model_id, algorithm, metrics: { roc_auc, accuracy, precision, recall, f1, log_loss, confusion_matrix }, feature_weights: [ { feature, weight } ], trained_at }`
- `POST /api/models/retrain`
  - Headers: `Authorization: Bearer <token>` (Requires `revops_admin` or `sales_manager`)
  - Response: `{ status: "SUCCESS", new_model_id, metrics: { ... }, improvements: { ... } }`

### Analytics & Leaderboard
- `GET /api/analytics/reps`
  - Response: Rep performance ranking by velocity, win rate, and total closed revenue.
- `GET /api/analytics/forecast`
  - Response: Comparative revenue forecast (AI Predicted vs Weighted CRM vs Commit).

