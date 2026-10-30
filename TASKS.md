# TASKS.md — Workstream Task Register

Prioritized workstreams for the AI-Powered Sales Funnel Analyzer application.

## Workstream 1: Project Architecture, Schema & Contracts
- [x] Initialize repository structure (`backend/` and `frontend/`)
- [x] Configure `package.json` for backend with ESM, Express, and `node:sqlite`
- [x] Configure `package.json` for frontend with Vite and React 18
- [x] Design relational SQLite schema with foreign keys and performance indexes
- [x] Create comprehensive B2B enterprise seed data (accounts, contacts, deals across stages, interactions)
- [x] Document data contracts in `DATA_CONTRACTS.md`

## Workstream 2: Core Machine Learning & Conversion Prediction Engine
- [x] Build Feature Engineering pipeline from historical interaction touchpoints
- [x] Build Z-Score Normalizer and Scaler
- [x] Build Supervised Logistic Classifier with L2 weight regularization and gradient descent
- [x] Build Model Evaluator computing ROC-AUC, Log-Loss, Precision, Recall, F1, and Confusion Matrix
- [x] Build Local Explainability (Additive Feature Attribution / SHAP-style contributions)
- [x] Build Next Best Action recommendation generator
- [x] Build What-If simulation engine
- [x] Write unit tests for ML Engine in `backend/tests/mlEngine.test.js`

## Workstream 3: Pipeline Analytics & Bottleneck Detection Services
- [x] Build `pipelineService.js` (Funnel stage metrics, conversion rates, pipeline velocity $/day)
- [x] Build `bottleneckService.js` (Statistical drop-off and stage duration anomaly detection)
- [x] Build `analyticsService.js` (Cohorts, rep leaderboards, win/loss breakdowns)
- [x] Write unit tests in `backend/tests/pipelineService.test.js` and `backend/tests/bottleneckService.test.js`

## Workstream 4: Backend REST API & Security Layer
- [x] Build `authService.js` with password hashing (`bcryptjs`) and JWT authentication
- [x] Build RBAC and authentication middlewares
- [x] Implement controllers for auth, pipeline, deals, predictions, bottlenecks, models, and analytics
- [x] Wire presentation routes in `routes.js`
- [x] Write integration and security tests in `backend/tests/api.test.js`, `backend/tests/auth.test.js`, and `backend/tests/security.test.js`

## Workstream 5: Interactive Executive Frontend Dashboard
- [x] Create responsive modern SaaS UI with dark theme
- [x] Implement Navigation Bar with Role Switcher (`revops_admin`, `sales_manager`, `sales_rep`)
- [x] Implement Executive KPI Bar (Pipeline Value, Velocity $/day, AI Forecast, Overall Conversion Rate)
- [x] Implement Interactive Funnel Visualizer (SVG stage polygons, conversion rates, cycle durations)
- [x] Implement Predictive Lead Scoring Table with AI Win Probability badges and drill-downs
- [x] Implement Interactive What-If Simulator Modal
- [x] Implement Bottleneck & Pipeline Friction Diagnostics with remediation playbooks
- [x] Implement Historical Interaction Touchpoint Timeline
- [x] Implement ML Model Management Lab (ROC-AUC metrics, confusion matrix, retraining trigger)
- [x] Implement Pipeline Velocity & Comparative Revenue Forecast

## Workstream 6: Verification, Quality Assurance & Delivery
- [x] Run backend automated tests (`npm test`) — 30/30 passed (100%)
- [x] Run backend linter (`npm run lint`) — 0 errors (clean Standard style)
- [x] Run frontend linter (`npm run lint`) — 0 errors (clean Standard style)
- [x] Run frontend production build (`npm run build`) — successful bundle creation in 561ms
- [x] Update documentation (`README.md`, `PROJECT_STATE.md`, `SECURITY_REVIEW.md`)

## Workstream 7: Frontend Engineering Overhaul (Visual Systems, 4D Particles & Micro-Interactions)
- [x] Implement 4D Clifford Torus Manifold Opportunity Particle Canvas (`PipelineParticleCanvas.jsx`) with downward gravitational drift, cursor interaction, and `prefers-reduced-motion` detection
- [x] Implement multi-tier Apple-inspired glassmorphism design system (`.kpi-card.interactive`, `.glass-alert`, `.bottleneck-card`, `.timeline-form-card`, `.timeline-bubble`, `.velocity-formula-banner`)
- [x] Build connected tapered geometry SVG sales funnel with chevron polygons and dynamic drop-off leakage pills
- [x] Implement active deal stage advancement (`api.updateDealStage`) in Funnel Visualizer and Predictive Lead Scoring
- [x] Add debounced slider input and request sequence locking in What-If Simulator to eliminate race conditions
- [x] Wire contact stakeholder selector in Touchpoint Timeline form to link economic buyers/champions
- [x] Add global keyboard shortcuts (`1`-`6` tab navigation, `P` particle pause/resume, `R` manual sync)
- [x] Verify in-browser headless Chromium Playwright test suite (15/15 passed) and 100% build & lint pass rate

