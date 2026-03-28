# Learning Workbench Full-Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the complete learning workbench website as a full product, not just a V1 shell: multi-user learner experience, formal content system, Python-first coding workspace, persistent AI expert, complete course inventory, admin/content operations, and forward-compatible expansion to additional languages and premium product capabilities.

**Architecture:** Retain the existing `Next.js + FastAPI + Python runner` stack as the platform base, but rebuild the website into a formal product in staged layers. Stage 1 establishes the app-first learner product. Stage 2 completes the content system and admin operations. Stage 3 expands the coding platform beyond the initial Python-only slice. Stage 4 hardens the product for production-scale operation, commercial features, and long-term maintainability. Each stage must ship working software and leave the codebase better structured for the next stage.

**Tech Stack:** Next.js 16, React 19, TypeScript, FastAPI, Python, Monaco Editor, DeepSeek Chat Completions API, persistent storage for accounts/content/progress, product admin tooling

---

## Scope Model

This is a **full-site master plan**, not a narrow V1 plan.

It intentionally covers:

- learner-facing product
- multi-user auth and persistence
- Python learning workspace
- AI expert and right-click learning actions
- complete learning content
- admin/content operations
- additional language expansion path
- mobile/responsive polish
- monetization/account lifecycle
- production hardening

Implementation order remains staged, but the plan includes the final website, not only the first release.

---

## Stage Breakdown

### Stage 1: Core Learner Product

Build the formal multi-user learner app:

- auth
- app shell
- resume routing
- studio-first product flow
- Monaco-based Python workspace
- DeepSeek AI expert
- progress persistence
- complete first Python learning path

### Stage 2: Content Platform And Admin

Build the real content system:

- structured content storage
- path/unit versioning
- content completeness validation
- admin authoring/review/publish flows
- prompt/template management
- publishing gates

### Stage 3: Platform Expansion

Expand beyond the first Python slice:

- second and third language support
- richer right-click actions
- stronger debugging tools
- richer visualization types
- better personalization/recommendation

### Stage 4: Product Completion

Bring the website to full product maturity:

- premium plans / monetization
- account lifecycle and billing-ready structures
- analytics / auditability
- mobile polish
- operational reliability
- production QA and long-tail completeness

---

## File Structure Map

### Learner Frontend

- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/globals.css`
- Replace or redirect: `apps/web/app/page.tsx`
- Create: `apps/web/app/auth/page.tsx`
- Create: `apps/web/app/app/page.tsx`
- Create: `apps/web/app/app/catalog/page.tsx`
- Create: `apps/web/app/app/lesson/[unitSlug]/page.tsx`
- Create: `apps/web/app/app/studio/[unitSlug]/page.tsx`
- Create: `apps/web/app/app/account/page.tsx`
- Create: `apps/web/app/app/settings/page.tsx`
- Create: `apps/web/app/api/auth/register/route.ts`
- Create: `apps/web/app/api/auth/login/route.ts`
- Create: `apps/web/app/api/auth/logout/route.ts`
- Create: `apps/web/app/api/studio/context-action/route.ts`
- Create: `apps/web/app/api/studio/session/route.ts`
- Create: `apps/web/components/app-shell.tsx`
- Create: `apps/web/components/auth-form.tsx`
- Create: `apps/web/components/monaco-workspace.tsx`
- Create: `apps/web/components/context-action-menu.tsx`
- Create: `apps/web/components/ai-expert-panel.tsx`
- Modify: `apps/web/components/studio-workspace.tsx`
- Modify: `apps/web/lib/learning-data.ts`
- Modify: `apps/web/lib/server-learning-api.ts`
- Create: `apps/web/lib/auth-client.ts`
- Create: `apps/web/lib/workspace-actions.ts`
- Create: `apps/web/lib/resume-session.ts`
- Create tests under `apps/web/lib/`

### Backend Product API

- Modify: `apps/api/app/schemas.py`
- Modify: `apps/api/app/services.py`
- Modify: `apps/api/app/current_user.py`
- Modify: `apps/api/app/settings.py`
- Modify: `apps/api/app/routers/auth.py`
- Modify: `apps/api/app/routers/progress.py`
- Modify: `apps/api/app/routers/studio.py`
- Modify: `apps/api/app/routers/ai.py`
- Modify: `apps/api/app/routers/content.py`
- Modify: `apps/api/app/routers/admin.py`
- Create: `apps/api/app/deepseek.py`
- Create: `apps/api/app/security.py`
- Create: `apps/api/app/content_store.py`
- Create: `apps/api/app/learning_state_store.py`
- Create: `apps/api/app/analytics.py`
- Add tests under `apps/api/tests/`

### Runner

- Modify: `apps/runner/app/executor.py`
- Modify: `apps/runner/app/main.py`
- Modify: `apps/runner/app/policy.py`
- Add tests under `apps/runner/tests/`

### Shared Contracts

- Modify: `packages/shared-types/src/index.ts`
- Extend tests in `packages/shared-types`

### Content / Schema

- Modify: `packages/content-schema`
- Add structured learning content validation and completeness rules

### Admin Frontend

- Modify: `apps/admin/app/layout.tsx`
- Modify: `apps/admin/app/page.tsx`
- Modify: `apps/admin/app/actions.ts`
- Create: `apps/admin/app/content/[unitSlug]/page.tsx`
- Create: `apps/admin/app/catalog/page.tsx`
- Create: `apps/admin/app/review/page.tsx`
- Modify supporting files under `apps/admin/lib`

---

## Stage 1 Tasks: Core Learner Product

### Task 1: Product-Grade Multi-User Auth And Session Infrastructure

**Files:**
- Modify: `apps/api/app/schemas.py`
- Modify: `apps/api/app/services.py`
- Modify: `apps/api/app/routers/auth.py`
- Modify: `apps/api/app/current_user.py`
- Create: `apps/api/app/security.py`
- Create: `apps/web/app/auth/page.tsx`
- Create: `apps/web/app/api/auth/register/route.ts`
- Create: `apps/web/app/api/auth/login/route.ts`
- Create: `apps/web/app/api/auth/logout/route.ts`
- Create: `apps/web/components/auth-form.tsx`
- Create: `apps/web/lib/auth-client.ts`
- Test: `apps/api/tests/test_auth_product.py`
- Test: `apps/web/lib/auth-client.test.ts`

- [ ] **Step 1: Write the failing backend auth tests**
- [ ] **Step 2: Write the failing frontend auth tests**
- [ ] **Step 3: Add password hashing and verification**
- [ ] **Step 4: Persist formal user accounts and sessions**
- [ ] **Step 5: Implement auth routes and UI**
- [ ] **Step 6: Verify backend and frontend auth**
- [ ] **Step 7: Commit**

### Task 2: App Shell, Resume Router, And Product Navigation

**Files:**
- Create: `apps/web/app/app/page.tsx`
- Create: `apps/web/app/app/catalog/page.tsx`
- Create: `apps/web/app/app/account/page.tsx`
- Create: `apps/web/app/app/settings/page.tsx`
- Create: `apps/web/components/app-shell.tsx`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/lib/learning-data.ts`
- Create: `apps/web/lib/resume-session.ts`
- Test: `apps/web/lib/learning-data.test.ts`

- [ ] **Step 1: Write failing resume/app-shell tests**
- [ ] **Step 2: Add last-location data contract**
- [ ] **Step 3: Build app shell**
- [ ] **Step 4: Implement resume-first `/app` routing**
- [ ] **Step 5: Implement catalog/account/settings routes**
- [ ] **Step 6: Verify tests and build**
- [ ] **Step 7: Commit**

### Task 3: Monaco-Based Python Workspace

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/components/monaco-workspace.tsx`
- Create: `apps/web/components/context-action-menu.tsx`
- Modify: `apps/web/components/studio-workspace.tsx`
- Modify: `apps/web/lib/studio-workspace.ts`
- Test: `apps/web/lib/studio-workspace.test.ts`

- [ ] **Step 1: Write failing workspace behavior tests**
- [ ] **Step 2: Add Monaco dependency and wrapper**
- [ ] **Step 3: Replace textarea-based editing**
- [ ] **Step 4: Add save/reset/template workflows**
- [ ] **Step 5: Verify tests and build**
- [ ] **Step 6: Commit**

### Task 4: Learning Context Menu And Workspace Actions

**Files:**
- Create: `apps/web/lib/workspace-actions.ts`
- Create: `apps/web/app/api/studio/context-action/route.ts`
- Modify: `apps/web/components/studio-workspace.tsx`
- Modify: `packages/shared-types/src/index.ts`
- Test: `apps/web/lib/workspace-actions.test.ts`
- Test: `packages/shared-types`

- [ ] **Step 1: Write failing action tests**
- [ ] **Step 2: Add explicit shared contracts for explain/debug/practice/note**
- [ ] **Step 3: Build right-click menu UI**
- [ ] **Step 4: Connect actions to AI/note/template flows**
- [ ] **Step 5: Verify tests**
- [ ] **Step 6: Commit**

### Task 5: DeepSeek-Powered Persistent AI Expert

**Files:**
- Create: `apps/api/app/deepseek.py`
- Modify: `apps/api/app/settings.py`
- Modify: `apps/api/app/routers/ai.py`
- Modify: `apps/api/app/services.py`
- Create: `apps/web/components/ai-expert-panel.tsx`
- Modify: `apps/web/app/api/studio/ai/route.ts`
- Modify: `apps/web/components/studio-workspace.tsx`
- Test: `apps/api/tests/test_ai_product.py`

- [ ] **Step 1: Write failing DeepSeek tests**
- [ ] **Step 2: Implement env-driven provider config**
- [ ] **Step 3: Add normalized DeepSeek client**
- [ ] **Step 4: Wire AI expert panel to persistent conversation**
- [ ] **Step 5: Verify tests and app behavior**
- [ ] **Step 6: Commit**

### Task 6: Python Runner Integration And Better Runtime Feedback

**Files:**
- Modify: `apps/runner/app/executor.py`
- Modify: `apps/runner/app/main.py`
- Modify: `apps/api/app/routers/run.py`
- Modify: `apps/web/app/api/studio/run/route.ts`
- Modify: `apps/web/components/studio-workspace.tsx`
- Tests: `apps/runner/tests/*`, `apps/api/tests/test_run.py`

- [ ] **Step 1: Write failing runtime UX tests**
- [ ] **Step 2: Ensure runtime exposes consistent stdout/stderr/trace/variables**
- [ ] **Step 3: Improve frontend runtime presentation**
- [ ] **Step 4: Add last successful run state handling**
- [ ] **Step 5: Verify runner and API tests**
- [ ] **Step 6: Commit**

### Task 7: Complete First Python Path To Product Standard

**Files:**
- Modify: `apps/api/app/services.py`
- Modify: `apps/api/app/schemas.py`
- Modify: `packages/content-schema`
- Modify: `apps/web/lib/learning-data.ts`
- Tests: `apps/api/tests/test_content.py`, web learning-data tests

- [ ] **Step 1: Write failing completeness tests**
- [ ] **Step 2: Expand Python unit inventory**
- [ ] **Step 3: Ensure each unit has explanation/example/templates/exercises/visualization/AI context**
- [ ] **Step 4: Verify API and web consumption**
- [ ] **Step 5: Commit**

### Task 8: Learner Product QA For Stage 1

**Files:**
- Touch all learner-facing files as needed

- [ ] **Step 1: Run full learner-facing test/build suite**
- [ ] **Step 2: Manually verify login -> resume -> studio -> run -> AI -> save -> restore loop**
- [ ] **Step 3: Fix any regressions**
- [ ] **Step 4: Commit stage-complete learner product**

---

## Stage 2 Tasks: Content Platform And Admin Completion

### Task 9: Replace In-File Content With Structured Content Storage

**Files:**
- Create: `apps/api/app/content_store.py`
- Modify: `apps/api/app/services.py`
- Modify: `apps/api/app/routers/content.py`
- Modify: `packages/content-schema`
- Add content fixtures/data files as needed

- [ ] **Step 1: Write failing tests for structured content loading**
- [ ] **Step 2: Extract content definitions from monolithic service file**
- [ ] **Step 3: Add schema validation and completeness validation**
- [ ] **Step 4: Verify content endpoints**
- [ ] **Step 5: Commit**

### Task 10: Product-Grade Admin Content Operations

**Files:**
- Modify: `apps/admin/app/page.tsx`
- Modify: `apps/admin/app/actions.ts`
- Create: `apps/admin/app/content/[unitSlug]/page.tsx`
- Create: `apps/admin/app/catalog/page.tsx`
- Create: `apps/admin/app/review/page.tsx`
- Modify: `apps/admin/lib/admin-data.ts`
- Modify: `apps/api/app/routers/admin.py`
- Modify: `apps/api/app/services.py`
- Add/extend tests in admin and api test suites

- [ ] **Step 1: Write failing tests for authoring/review/publish detail pages**
- [ ] **Step 2: Build structured admin routes**
- [ ] **Step 3: Add content validation, review notes, completeness gates**
- [ ] **Step 4: Verify admin tests/build**
- [ ] **Step 5: Commit**

### Task 11: Content Versioning, Status, And Publish Integrity

**Files:**
- Modify: `apps/api/app/schemas.py`
- Modify: `apps/api/app/services.py`
- Modify: `packages/shared-types/src/index.ts`
- Add tests in `apps/api/tests/test_admin.py`

- [ ] **Step 1: Write failing tests for versioned content status rules**
- [ ] **Step 2: Add version/status metadata**
- [ ] **Step 3: Prevent invalid publish states**
- [ ] **Step 4: Verify tests**
- [ ] **Step 5: Commit**

### Task 12: Full Python Catalog Completion

**Files:**
- Modify structured content files/source
- Extend learner/admin displays and tests

- [ ] **Step 1: Define complete Python path lineup**
- [ ] **Step 2: Fill all required lesson content blocks**
- [ ] **Step 3: Verify completeness validators**
- [ ] **Step 4: Commit**

---

## Stage 3 Tasks: Platform Expansion

### Task 13: Generalize Workspace To Additional Languages

**Files:**
- Modify shared types, frontend workspace, api schemas, runner policy
- Create language capability abstraction where needed

- [ ] **Step 1: Write failing tests for non-Python language contracts**
- [ ] **Step 2: Refactor workspace from Python-only assumptions**
- [ ] **Step 3: Add second language support**
- [ ] **Step 4: Verify contracts and UI**
- [ ] **Step 5: Commit**

### Task 14: Richer Debugging And Learning Actions

**Files:**
- Modify AI routes, workspace actions, expert panel, runtime surfaces

- [ ] **Step 1: Add explain/debug/practice/note action depth**
- [ ] **Step 2: Add follow-up suggested actions**
- [ ] **Step 3: Add note pinning and review surfaces**
- [ ] **Step 4: Verify**
- [ ] **Step 5: Commit**

### Task 15: Personalization And Recommendation Layer

**Files:**
- Modify learner state and recommendation logic
- Extend `/app` and `/app/catalog`

- [ ] **Step 1: Add recommendation data model**
- [ ] **Step 2: Surface next-best lesson/exercise recommendations**
- [ ] **Step 3: Verify**
- [ ] **Step 4: Commit**

### Task 16: Additional Paths, Visualizations, And Content Depth

**Files:**
- Extend content store, schema, web displays, admin surfaces

- [ ] **Step 1: Add new paths beyond the first Python track**
- [ ] **Step 2: Add richer visualization kinds**
- [ ] **Step 3: Verify completeness and UX**
- [ ] **Step 4: Commit**

---

## Stage 4 Tasks: Product Completion

### Task 17: Premium Plans, Access Control, And Account Lifecycle

**Files:**
- Modify account data model and settings pages
- Add entitlement checks across API and frontend

- [ ] **Step 1: Model plans and entitlements**
- [ ] **Step 2: Add account-level settings surfaces**
- [ ] **Step 3: Verify access control behavior**
- [ ] **Step 4: Commit**

### Task 18: Analytics, Auditability, And Product Telemetry

**Files:**
- Create: `apps/api/app/analytics.py`
- Extend learner/admin/product events

- [ ] **Step 1: Add event model for key product actions**
- [ ] **Step 2: Surface admin insight/reporting hooks**
- [ ] **Step 3: Verify event logging**
- [ ] **Step 4: Commit**

### Task 19: Mobile And Responsive Product Polish

**Files:**
- Primarily learner frontend components/routes/styles

- [ ] **Step 1: Audit all app routes across mobile breakpoints**
- [ ] **Step 2: Add responsive workspace fallbacks**
- [ ] **Step 3: Verify browser QA**
- [ ] **Step 4: Commit**

### Task 20: Production Hardening And Final Full-Site QA

**Files:**
- Whole stack as needed

- [ ] **Step 1: Run full-stack tests/builds**
- [ ] **Step 2: Run browser-driven QA for learner and admin products**
- [ ] **Step 3: Verify complete website requirements against approved spec**
- [ ] **Step 4: Fix remaining gaps**
- [ ] **Step 5: Commit final full-site completion milestone**

---

## Verification Commands

Use these repeatedly at stage boundaries:

```bash
npm run test --workspace apps/web
npm run build --workspace apps/web
npm run test --workspace apps/admin
npm run build --workspace apps/admin
cd apps/api && uv run pytest
cd apps/runner && uv run pytest
npm run test --workspace packages/shared-types
npm run test --workspace packages/content-schema
```

## Review Notes

- The earlier file `docs/superpowers/plans/2026-03-28-learning-workbench-implementation.md` should now be treated as the **Stage 1 / V1 slice**.
- This file is the **master implementation plan for the complete website**.
- This plan intentionally includes capabilities that were previously marked deferred, because the user explicitly requested the implementation plan to cover the full final website.
- This plan still stages delivery so each checkpoint ships coherent working software.

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-03-28-learning-workbench-full-site-implementation.md`.

Recommended execution order:

1. Implement Stage 1 completely
2. Implement Stage 2 completely
3. Expand with Stage 3
4. Finish product maturity with Stage 4
