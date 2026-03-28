# Learning Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the learner-facing product into a multi-user, app-first Python learning workbench with Monaco-class editing, persistent progress, and a real DeepSeek-powered AI expert.

**Architecture:** Keep the existing `Next.js + FastAPI + Python runner` stack, but replace the learner-facing information architecture and product shell with a formal app. Move from demo-shaped data flows to product-shaped auth, resume routing, persistent learning state, content completeness, and structured AI actions. Keep Python runner execution on the backend and layer a Monaco-based client workspace plus right-click learning actions on top.

**Tech Stack:** Next.js 16, React 19, TypeScript, FastAPI, Python, existing runner service, Monaco Editor, DeepSeek Chat Completions API

---

## File Structure

### Frontend

- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/globals.css`
- Create: `apps/web/app/auth/page.tsx`
- Create: `apps/web/app/app/page.tsx`
- Create: `apps/web/app/app/catalog/page.tsx`
- Create: `apps/web/app/app/lesson/[unitSlug]/page.tsx`
- Create: `apps/web/app/app/studio/[unitSlug]/page.tsx`
- Create: `apps/web/app/app/account/page.tsx`
- Create: `apps/web/app/api/auth/register/route.ts`
- Create: `apps/web/app/api/auth/login/route.ts`
- Create: `apps/web/app/api/auth/logout/route.ts`
- Create: `apps/web/app/api/studio/context-action/route.ts`
- Create: `apps/web/components/app-shell.tsx`
- Create: `apps/web/components/auth-form.tsx`
- Create: `apps/web/components/monaco-workspace.tsx`
- Modify: `apps/web/components/studio-workspace.tsx`
- Modify: `apps/web/lib/learning-data.ts`
- Modify: `apps/web/lib/server-learning-api.ts`
- Create: `apps/web/lib/auth-client.ts`
- Create: `apps/web/lib/workspace-actions.ts`
- Test: `apps/web/lib/learning-data.test.ts`
- Test: `apps/web/lib/studio-workspace.test.ts`
- Create Test: `apps/web/lib/auth-client.test.ts`
- Create Test: `apps/web/lib/workspace-actions.test.ts`

### Backend

- Modify: `apps/api/app/schemas.py`
- Modify: `apps/api/app/services.py`
- Modify: `apps/api/app/current_user.py`
- Modify: `apps/api/app/settings.py`
- Modify: `apps/api/app/routers/auth.py`
- Modify: `apps/api/app/routers/progress.py`
- Modify: `apps/api/app/routers/studio.py`
- Modify: `apps/api/app/routers/ai.py`
- Create: `apps/api/app/deepseek.py`
- Create: `apps/api/app/security.py`
- Test: `apps/api/tests/test_app.py`
- Test: `apps/api/tests/test_learner_state.py`
- Test: `apps/api/tests/test_run.py`
- Create Test: `apps/api/tests/test_auth_product.py`
- Create Test: `apps/api/tests/test_ai_product.py`

### Shared Contracts

- Modify: `packages/shared-types/src/index.ts`
- Test: `packages/shared-types/tests/*.test.ts` or extend existing shared-types tests

### Content

- Modify: `apps/api/app/services.py`
- Create or extend structured content source for Python path completeness inside the current service layer
- Add enough Python content records to satisfy the approved V1 completeness bar

---

### Task 1: Product Auth And Resume Routing

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
- Create Test: `apps/api/tests/test_auth_product.py`
- Create Test: `apps/web/lib/auth-client.test.ts`

- [ ] **Step 1: Write the failing backend auth product tests**

```python
def test_register_returns_persisted_user_and_session_token(): ...
def test_login_rejects_invalid_password(): ...
def test_current_user_resolves_hashed_password_account(): ...
```

Run: `cd apps/api && uv run pytest tests/test_auth_product.py -v`
Expected: FAIL because product-grade password auth and session helpers do not exist.

- [ ] **Step 2: Write the failing frontend auth client tests**

```ts
test("login posts credentials and stores app session");
test("logout clears the current app session cookie");
```

Run: `npm run test --workspace apps/web -- auth-client.test.ts`
Expected: FAIL because `auth-client.ts` does not exist.

- [ ] **Step 3: Implement secure password and session handling**

Add a focused security helper for:

```python
def hash_password(password: str) -> str: ...
def verify_password(password: str, hashed: str) -> bool: ...
```

Extend user records to persist hashed passwords and last-opened unit metadata.

- [ ] **Step 4: Implement register/login/logout web routes**

The web routes should proxy to FastAPI and normalize cookie behavior so the app shell can rely on one session source.

- [ ] **Step 5: Add auth UI and redirect behavior**

`/auth` should support login + register and redirect to `/app` on success.

- [ ] **Step 6: Verify auth tests pass**

Run:
- `cd apps/api && uv run pytest tests/test_auth_product.py -v`
- `npm run test --workspace apps/web -- auth-client.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/app apps/api/tests apps/web/app/auth apps/web/app/api/auth apps/web/components/auth-form.tsx apps/web/lib/auth-client.ts apps/web/lib/auth-client.test.ts
git commit -m "feat: add product auth and session routing"
```

### Task 2: App Shell And Resume-To-Last-Session Entry

**Files:**
- Create: `apps/web/app/app/page.tsx`
- Create: `apps/web/app/app/catalog/page.tsx`
- Create: `apps/web/app/app/account/page.tsx`
- Create: `apps/web/components/app-shell.tsx`
- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/lib/learning-data.ts`
- Test: `apps/web/lib/learning-data.test.ts`

- [ ] **Step 1: Write the failing resume routing tests**

```ts
test("getCurrentLearnerOverview exposes last opened unit");
test("app entry resolves to last studio location when available");
```

Run: `npm run test --workspace apps/web -- learning-data.test.ts`
Expected: FAIL because last-session routing is not modeled.

- [ ] **Step 2: Extend learner data contracts to include last location**

Add fields for:

```ts
type LastLearningLocation = {
  unitSlug: string;
  view: "studio" | "lesson";
};
```

- [ ] **Step 3: Build the formal app shell**

`app-shell.tsx` should become the single learner-facing chrome with:
- global nav
- recent progress summary
- account entry
- catalog entry
- restore session affordance

- [ ] **Step 4: Implement `/app` as a resume router**

Behavior:
- if user has last opened unit => redirect to `/app/studio/[unitSlug]`
- else redirect to first recommended Python unit

- [ ] **Step 5: Implement `/app/catalog` and `/app/account`**

They should fit the app-first model, not the old marketing/demo layout.

- [ ] **Step 6: Verify**

Run:
- `npm run test --workspace apps/web -- learning-data.test.ts`
- `npm run build --workspace apps/web`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/app apps/web/components/app-shell.tsx apps/web/lib/learning-data.ts apps/web/lib/learning-data.test.ts apps/web/app/layout.tsx
git commit -m "feat: add app shell and resume-first routing"
```

### Task 3: Shared Contracts For Product Studio Actions

**Files:**
- Modify: `packages/shared-types/src/index.ts`
- Modify: `apps/web/lib/studio-workspace.ts`
- Create: `apps/web/lib/workspace-actions.ts`
- Create Test: `apps/web/lib/workspace-actions.test.ts`
- Extend tests in `packages/shared-types`

- [ ] **Step 1: Write failing tests for context actions**

```ts
test("buildContextActions returns explain debug practice note actions");
test("workspace action payload includes selected code and unit context");
```

Run: `npm run test --workspace apps/web -- workspace-actions.test.ts`
Expected: FAIL because workspace action helpers do not exist.

- [ ] **Step 2: Expand shared types**

Add explicit contracts for:
- context action request
- AI expert message
- last learning location
- content completeness metadata

- [ ] **Step 3: Add frontend workspace action helpers**

Define one source of truth for right-click actions:

```ts
const CONTEXT_ACTIONS = ["explain", "debug", "practice", "note"] as const;
```

- [ ] **Step 4: Verify**

Run:
- `npm run test --workspace apps/web -- workspace-actions.test.ts`
- `npm run test --workspace packages/shared-types`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared-types/src/index.ts apps/web/lib/studio-workspace.ts apps/web/lib/workspace-actions.ts apps/web/lib/workspace-actions.test.ts
git commit -m "feat: add shared contracts for workspace actions"
```

### Task 4: DeepSeek AI Service And Persistent Expert Conversation

**Files:**
- Create: `apps/api/app/deepseek.py`
- Modify: `apps/api/app/settings.py`
- Modify: `apps/api/app/routers/ai.py`
- Modify: `apps/api/app/services.py`
- Modify: `apps/web/app/api/studio/ai/route.ts`
- Modify: `apps/web/components/studio-workspace.tsx`
- Create Test: `apps/api/tests/test_ai_product.py`

- [ ] **Step 1: Write the failing AI service tests**

```python
def test_ai_route_builds_deepseek_request_with_selected_code_and_context(): ...
def test_ai_route_returns_structured_error_when_provider_fails(): ...
```

Run: `cd apps/api && uv run pytest tests/test_ai_product.py -v`
Expected: FAIL because DeepSeek integration does not exist.

- [ ] **Step 2: Implement provider settings**

Use environment variables only:

```python
DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
DEEPSEEK_API_URL = os.environ.get("DEEPSEEK_API_URL", "https://api.deepseek.com/chat/completions")
```

- [ ] **Step 3: Implement a formal DeepSeek client**

The client should:
- build request messages from code + selected text + unit context + action type
- handle provider failures
- return a normalized AI expert response

- [ ] **Step 4: Upgrade the studio AI route and conversation UI**

The right pane should keep persistent messages and context-action provenance.

- [ ] **Step 5: Verify**

Run:
- `cd apps/api && uv run pytest tests/test_ai_product.py -v`
- `npm run test --workspace apps/web`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/app/deepseek.py apps/api/app/settings.py apps/api/app/routers/ai.py apps/api/app/services.py apps/api/tests/test_ai_product.py apps/web/app/api/studio/ai/route.ts apps/web/components/studio-workspace.tsx
git commit -m "feat: add deepseek expert conversation service"
```

### Task 5: Monaco-Based Python Workspace And Learning Context Menu

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/components/monaco-workspace.tsx`
- Modify: `apps/web/components/studio-workspace.tsx`
- Modify: `apps/web/app/api/studio/run/route.ts`
- Create: `apps/web/app/api/studio/context-action/route.ts`
- Test: `apps/web/lib/studio-workspace.test.ts`

- [ ] **Step 1: Write the failing editor tests**

```ts
test("workspace exposes formal context menu actions");
test("templates include scratch example and scaffold variants");
```

Run: `npm run test --workspace apps/web -- studio-workspace.test.ts`
Expected: FAIL for missing product-grade editor action handling.

- [ ] **Step 2: Add Monaco dependency and wrapper**

Create a focused component responsible only for:
- editor init
- selection extraction
- context menu hook
- code value changes

- [ ] **Step 3: Implement the learning context menu**

Required actions:
- explain selected code
- analyze error
- generate similar exercise
- add to notes

- [ ] **Step 4: Wire Monaco workspace into the studio**

The studio should stop using a plain `textarea`.

- [ ] **Step 5: Verify**

Run:
- `npm run test --workspace apps/web -- studio-workspace.test.ts`
- `npm run build --workspace apps/web`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/package.json apps/web/components/monaco-workspace.tsx apps/web/components/studio-workspace.tsx apps/web/app/api/studio/run/route.ts apps/web/app/api/studio/context-action/route.ts apps/web/lib/studio-workspace.test.ts
git commit -m "feat: replace textarea with monaco learning workspace"
```

### Task 6: Rebuild Learner Pages Around The App-First Product

**Files:**
- Modify or replace: `apps/web/app/page.tsx`
- Create: `apps/web/app/app/studio/[unitSlug]/page.tsx`
- Create: `apps/web/app/app/lesson/[unitSlug]/page.tsx`
- Modify or replace: `apps/web/app/globals.css`
- Modify: `apps/web/components/learner-shell.tsx`
- Modify: `apps/web/components/path-card.tsx`
- Modify: `apps/web/components/learner-progress.tsx`

- [ ] **Step 1: Write the failing route-level expectations**

Add or extend tests to encode:
- app-first routing
- studio-first product framing
- no dependency on the old marketing home as primary learner flow

- [ ] **Step 2: Rebuild the app-facing routes**

The working routes should be:
- `/auth`
- `/app`
- `/app/catalog`
- `/app/lesson/[unitSlug]`
- `/app/studio/[unitSlug]`
- `/app/account`

- [ ] **Step 3: Demote the old root routes**

Either redirect them or treat them as thin compatibility wrappers. Do not maintain two competing learner experiences.

- [ ] **Step 4: Verify**

Run:
- `npm run test --workspace apps/web`
- `npm run build --workspace apps/web`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app apps/web/components apps/web/app/globals.css
git commit -m "feat: rebuild learner routes around the app-first product"
```

### Task 7: Content Completeness For The Python Foundation Path

**Files:**
- Modify: `apps/api/app/services.py`
- Modify: `apps/api/app/schemas.py`
- Modify: `apps/web/lib/learning-data.ts`
- Extend backend tests related to content and studio bootstrap

- [ ] **Step 1: Write the failing completeness tests**

```python
def test_python_path_units_have_explanation_example_templates_exercises_and_visualization(): ...
```

Run: `cd apps/api && uv run pytest tests/test_content.py -v`
Expected: FAIL because current Python path content is too shallow.

- [ ] **Step 2: Expand Python path content to the approved V1 bar**

Each published Python unit should have:
- concept explanation
- example code
- blank scratch template support
- at least 2 exercises
- at least 1 scaffold/frame exercise
- visualization frames
- AI context

- [ ] **Step 3: Ensure the frontend consumes the richer content model**

Keep the content model explicit so the UI can show template variants without hardcoding them.

- [ ] **Step 4: Verify**

Run:
- `cd apps/api && uv run pytest`
- `npm run test --workspace apps/web`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/app/services.py apps/api/app/schemas.py apps/api/tests apps/web/lib/learning-data.ts
git commit -m "feat: complete python path content for v1"
```

### Task 8: End-To-End Product Verification And Cleanup

**Files:**
- Modify as needed from prior tasks
- Verification notes should reference the approved spec at `docs/superpowers/specs/2026-03-28-learning-workbench-design.md`

- [ ] **Step 1: Run the full verification suite**

Run:
- `npm run test --workspace apps/web`
- `npm run build --workspace apps/web`
- `npm run test --workspace apps/admin`
- `npm run build --workspace apps/admin`
- `cd apps/api && uv run pytest`
- `cd apps/runner && uv run pytest`
- `npm run test --workspace packages/shared-types`
- `npm run test --workspace packages/content-schema`

Expected: PASS across the stack.

- [ ] **Step 2: Verify the approved V1 checklist manually**

Manually validate:
- register/login
- resume to last session
- studio load
- Monaco editor
- run Python
- right-click actions
- DeepSeek conversation
- content completeness for the Python path

- [ ] **Step 3: Resolve any remaining product inconsistencies**

Only ship when the approved spec and V1 definition of done are met.

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: complete v1 learning workbench product"
```

## Review Notes

- This plan intentionally does **not** continue the old learner-facing demo route structure as the primary product.
- This plan intentionally treats content completeness as part of the product implementation, not as a follow-up side task.
- This plan assumes local review rather than spawning a reviewer subagent because no explicit delegation request was made in this session.

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-03-28-learning-workbench-implementation.md`.

Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh subagent per task, review between tasks
2. Inline Execution - execute tasks in this session in sequence
