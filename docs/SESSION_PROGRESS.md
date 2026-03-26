# Session Progress

## 2026-03-26

### Automation Run: Learner State Persistence

#### Completed This Run

- Finished one full bounded part: `persistent learner auth and progress state across API restarts`.
- Added an env-configurable learner state file path with a repo-local default at `apps/api/.local/learner-state.json` so learner registrations and progress have a stable persistence target in:
  - [apps/api/app/settings.py](/Users/li/learningByDoing/apps/api/app/settings.py)
- Introduced an explicit `LearnerState` persistence schema for user profiles plus progress records in:
  - [apps/api/app/schemas.py](/Users/li/learningByDoing/apps/api/app/schemas.py)
- Reworked the learner service layer to:
  - load persisted learner state at startup when present
  - rebuild the in-memory email and `(user_id, unit_id)` indexes from JSON on reload
  - atomically rewrite learner state after register, save-progress, and complete-progress mutations
  - expose a reset helper for isolated restart-style tests
  - [apps/api/app/services.py](/Users/li/learningByDoing/apps/api/app/services.py)
- Added backend regression coverage that proves:
  - registering a learner writes a persisted state file
  - saving progress writes the learner progress record into that file
  - clearing only in-memory state removes the learner until reload
  - reloading persisted learner state restores the same `user_id` and saved progress through the API
  - [apps/api/tests/test_learner_state.py](/Users/li/learningByDoing/apps/api/tests/test_learner_state.py)

#### Verification Evidence

- Baseline before edits: `cd apps/api && uv run pytest` -> 25 tests passed.
- Red phase: `cd apps/api && uv run pytest tests/test_learner_state.py` -> collection failed with `ImportError: cannot import name 'reload_learner_state'`, proving learner restart persistence hooks did not exist yet.
- Green phase: `cd apps/api && uv run pytest tests/test_learner_state.py` -> 1 test passed.
- Targeted backend regression check: `cd apps/api && uv run pytest tests/test_app.py tests/test_learner_state.py` -> 5 tests passed.
- Broader backend regression check: `cd apps/api && uv run pytest` -> 26 tests passed.

#### Blockers / Concerns

- Codex second-opinion review was attempted again, but the local `codex` CLI still failed before producing findings. This run emitted `failed to refresh available models: stream disconnected before completion`, repeated response-stream retries, and the local state DB warning `migration 20 was previously applied but is missing in the resolved migrations`.
- Persisted learner-state recovery is resilient but still quiet: malformed learner JSON currently falls back to default seeded state rather than surfacing a dedicated operator-facing repair signal.
- `/auth/me` and `/progress/me` still resolve the hardcoded demo learner, so persistence now survives restarts but current-user resolution is still a separate gap.

#### Recommended Next Part

- Replace hardcoded demo learner resolution in `/auth/me`, `/progress/me`, and studio bootstrap with a shared current-user/session resolver.

### Automation Run: Admin Content-Ops Persistence

#### Completed This Run

- Finished one full bounded part: `persistent admin content-ops state across API restarts`.
- Added an env-configurable admin state file path with a repo-local default at `apps/api/.local/admin-content-state.json` so the API has a stable place to persist mutable admin workflow state in:
  - [apps/api/app/settings.py](/Users/li/learningByDoing/apps/api/app/settings.py)
- Introduced an explicit `AdminContentOpsState` persistence schema for unit statuses, prompt templates, and publishing checks in:
  - [apps/api/app/schemas.py](/Users/li/learningByDoing/apps/api/app/schemas.py)
- Reworked the admin service layer to:
  - load persisted admin state at startup when present
  - atomically rewrite the JSON state file after each admin status/template/check edit
  - expose a reload helper for restart-style regression coverage
  - keep reset behavior available for isolated tests
  - [apps/api/app/services.py](/Users/li/learningByDoing/apps/api/app/services.py)
- Added backend regression coverage that proves:
  - admin edits write a state file
  - a reset can clear only in-memory state
  - the API can reload the persisted admin edits afterward
  - [apps/api/tests/test_admin.py](/Users/li/learningByDoing/apps/api/tests/test_admin.py)
- Ignored the repo-local persisted API state directory so automation runs do not try to commit mutable runtime data in:
  - [.gitignore](/Users/li/learningByDoing/.gitignore)

#### Verification Evidence

- Baseline before edits: `npm test` -> success (`packages/content-schema` 2 tests passed, `packages/shared-types` 6 tests passed).
- Baseline before edits: `npm run typecheck` -> success.
- Baseline before edits: `cd apps/api && uv run pytest` -> 24 tests passed.
- Red phase: `cd apps/api && uv run pytest tests/test_admin.py -k persists_and_reloads` -> collection failed with `ImportError: cannot import name 'reload_admin_content_state'`, proving the restart/reload persistence behavior did not exist yet.
- Green phase: `cd apps/api && uv run pytest tests/test_admin.py -k persists_and_reloads` -> 1 test passed.
- Green phase: `cd apps/api && uv run pytest tests/test_admin.py` -> 9 tests passed.
- Broader backend regression check: `cd apps/api && uv run pytest` -> 25 tests passed.
- Workspace regression check: `npm test` -> success (`packages/content-schema` 2 tests passed, `packages/shared-types` 6 tests passed).
- Workspace type safety check: `npm run typecheck` -> success.

#### Blockers / Concerns

- Codex second-opinion review was attempted again, but the local `codex` CLI still failed before producing findings. This run emitted `failed to refresh available models: stream disconnected before completion`, repeated sampling retries, and the local state DB warning `migration 20 was previously applied but is missing in the resolved migrations`.
- If the persisted admin JSON file becomes malformed, the API currently falls back to defaults rather than surfacing a dedicated operator-facing repair signal. That keeps startup resilient, but it is still a recovery-path gap.

#### Recommended Next Part

- Introduce persistence layers for learner auth and progress beyond in-memory stores so learner state survives API restarts too.

### Automation Run: Admin Backend Schema Tightening

#### Completed This Run

- Finished one full bounded part: `admin backend schema tightening for visualization_kind and seed responses`.
- Introduced an explicit backend `VisualizationKind` literal alias, reused it across the core visualization schema and the admin inventory response model, and added a dedicated `AdminSeedContentResponse` model in:
  - [apps/api/app/schemas.py](/Users/li/learningByDoing/apps/api/app/schemas.py)
- Switched the admin seed route onto the explicit response model so FastAPI/OpenAPI no longer expose an untyped dict at that boundary in:
  - [apps/api/app/routers/admin.py](/Users/li/learningByDoing/apps/api/app/routers/admin.py)
- Tightened the shared TypeScript admin contract so `ApiAdminUnitInventoryItem["visualization_kind"]` now uses the shared `VisualizationKind` union instead of `string` in:
  - [packages/shared-types/src/index.ts](/Users/li/learningByDoing/packages/shared-types/src/index.ts)
- Removed the last admin frontend cast on `visualization_kind`; the admin data adapter now accepts the backend-aligned type directly in:
  - [apps/admin/lib/admin-data.ts](/Users/li/learningByDoing/apps/admin/lib/admin-data.ts)
- Added regression coverage that locks the OpenAPI enum/ref shape and the shared TypeScript literal contract in:
  - [apps/api/tests/test_admin.py](/Users/li/learningByDoing/apps/api/tests/test_admin.py)
  - [packages/shared-types/tests/contracts.test.ts](/Users/li/learningByDoing/packages/shared-types/tests/contracts.test.ts)

#### Verification Evidence

- Red phase: `cd apps/api && uv run pytest tests/test_admin.py` -> 1 failure in `test_admin_openapi_models_visualization_kind_and_seed_response_explicitly`; OpenAPI exposed `visualization_kind` without an `enum` (`KeyError: 'enum'`), proving the admin schema boundary was still loose.
- Red phase: `npm run typecheck --workspace packages/shared-types` -> failed because `ApiAdminUnitInventoryItem["visualization_kind"]` was still `string`, leaving the `@ts-expect-error` unused and the literal contract assertion broken.
- Green phase: `cd apps/api && uv run pytest tests/test_admin.py` -> 9 tests passed.
- Green phase: `npm run test --workspace packages/shared-types` -> 6 tests passed.
- Green phase: `npm run typecheck --workspace packages/shared-types` -> success.
- Green phase: `npm run test --workspace apps/admin` -> 5 tests passed.
- Green phase: `npm run typecheck --workspace apps/admin` -> success.
- Broader backend regression check: `cd apps/api && uv run pytest` -> 25 tests passed.
- Admin production safety check: `npm run build --workspace apps/admin` -> success; `/` remains dynamic (`ƒ`) and `/_not-found` remains static (`○`).

#### Blockers / Concerns

- Codex second-opinion review was attempted again, but the local `codex` CLI still failed before producing findings. This run emitted `failed to refresh available models: stream disconnected before completion` plus repeated sampling retries and the local state DB warning `migration 20 was previously applied but is missing in the resolved migrations`.
- Admin content-ops edits are still stored only in memory. The schema boundary is now explicit, but unit status/template/check state still resets when the API process restarts.

#### Recommended Next Part

- Persist admin content-ops workflow state beyond in-memory process lifetime so edits in the admin API and UI survive restarts.

### Automation Run: Shared Admin API Contracts

#### Completed This Run

- Finished one full bounded part: `shared TypeScript admin API contracts plus admin app adoption`.
- Added backend-aligned admin contract exports for dashboard metrics, unit inventory, config bundles, PATCH payloads, seed responses, and admin status literal sets in:
  - [packages/shared-types/src/index.ts](/Users/li/learningByDoing/packages/shared-types/src/index.ts)
- Extended shared contract coverage so admin payload shapes and literal sets are locked alongside the learner contracts in:
  - [packages/shared-types/tests/contracts.test.ts](/Users/li/learningByDoing/packages/shared-types/tests/contracts.test.ts)
- Replaced duplicated snake_case admin API model declarations in the admin data layer with imports from the shared contract package while preserving the existing camelCase UI view models in:
  - [apps/admin/lib/admin-data.ts](/Users/li/learningByDoing/apps/admin/lib/admin-data.ts)
- Moved the admin server actions off inline literal union casts and onto the shared admin status aliases in:
  - [apps/admin/app/actions.ts](/Users/li/learningByDoing/apps/admin/app/actions.ts)
- Tightened the admin data tests so their fixtures and PATCH payload expectations are typed against the shared admin contract package in:
  - [apps/admin/lib/admin-data.test.ts](/Users/li/learningByDoing/apps/admin/lib/admin-data.test.ts)
- Added the shared contract workspace dependency to the admin app and synced the lockfile in:
  - [apps/admin/package.json](/Users/li/learningByDoing/apps/admin/package.json)
  - [package-lock.json](/Users/li/learningByDoing/package-lock.json)

#### Verification Evidence

- Red phase: `npm run test --workspace packages/shared-types` -> 1 failure (`ADMIN_UNIT_CONTENT_STATUSES` was `undefined`), proving the admin shared contract surface did not exist yet.
- Green phase: `npm run test --workspace packages/shared-types` -> 6 tests passed.
- Shared contract type safety: `npm run typecheck --workspace packages/shared-types` -> success.
- Admin regression check: `npm run test --workspace apps/admin` -> 5 tests passed.
- Admin type safety: `npm run typecheck --workspace apps/admin` -> success.
- Admin production build: `npm run build --workspace apps/admin` -> success; `/` remains dynamic (`ƒ`) and `/_not-found` remains static (`○`).
- Backend compatibility check: `cd apps/api && uv run pytest tests/test_admin.py` -> 7 tests passed.
- Workspace lockfile sync: `npm install --package-lock-only --ignore-scripts` -> success.

#### Blockers / Concerns

- Codex second-opinion review was attempted again, but the local `codex` CLI still failed before producing findings. The run emitted `failed to refresh available models: stream disconnected before completion` plus repeated retries and the local state DB warning `migration 20 was previously applied but is missing in the resolved migrations`.
- The shared admin contract layer mirrors the current backend shape where `visualization_kind` is still typed as plain `str` on the Python side. The admin UI continues to narrow it back to the known visualization union at the frontend boundary.

#### Recommended Next Part

- Tighten the admin backend schema layer so `visualization_kind` and the seed response use explicit response models, removing the last admin contract cast and untyped dict boundary.

### Automation Run: Shared Learner API Contracts

#### Completed This Run

- Finished one full bounded part: `shared learner content + studio bootstrap TypeScript API contracts`.
- Added backend-aligned learner API contract exports in:
  - [packages/shared-types/src/index.ts](/Users/li/learningByDoing/packages/shared-types/src/index.ts)
- Extended shared contract coverage to lock the learner API literal sets and the full studio bootstrap payload shape in:
  - [packages/shared-types/tests/contracts.test.ts](/Users/li/learningByDoing/packages/shared-types/tests/contracts.test.ts)
- Moved the web learner adapter off its inline duplicated API payload declarations and onto the shared contract module while preserving the existing camelCase UI view models in:
  - [apps/web/lib/learning-data.ts](/Users/li/learningByDoing/apps/web/lib/learning-data.ts)
- Tightened the studio bootstrap regression coverage so the web test locks the presence of the full backend run payload in:
  - [apps/web/lib/learning-data.test.ts](/Users/li/learningByDoing/apps/web/lib/learning-data.test.ts)

#### Verification Evidence

- Red phase: `npm run test --workspace packages/shared-types` -> 1 failure (`AUDIENCE_LEVELS` was `undefined`), proving the shared learner API contract surface did not exist yet.
- Red phase: `npm run typecheck --workspace apps/web` -> failed because `ApiLearningPathSummary`, `ApiLearningUnit`, and `ApiStudioBootstrapResponse` were missing from `packages/shared-types/src`, and the studio `runResult` type did not yet include the backend trace payload fields.
- Green phase: `npm run test --workspace packages/shared-types` -> 5 tests passed.
- Green phase: `npm run test --workspace apps/web -- learning-data.test.ts` -> 5 tests passed.
- Green phase: `npm run typecheck --workspace apps/web` -> success.
- Broader package verification: `npm test` -> success (`packages/content-schema` 2 tests passed, `packages/shared-types` 5 tests passed).
- Broader web verification: `npm run test --workspace apps/web` -> 5 tests passed.
- Web production build: `npm run build:web` -> success; `/`, `/learn/[pathId]`, `/learn/[pathId]/[unitSlug]`, `/studio`, and `/studio/[unitSlug]` remain server-rendered (`ƒ`) as expected.

#### Blockers / Concerns

- The shared contract layer now covers learner content and studio bootstrap only. Admin content-ops payloads still duplicate FastAPI models inside [apps/admin/lib/admin-data.ts](/Users/li/learningByDoing/apps/admin/lib/admin-data.ts).
- Codex second-opinion review was attempted again, but the local `codex` CLI still failed before producing findings. The run emitted repeated upstream `stream disconnected before completion` retries plus the local state DB warning `migration 20 was previously applied but is missing in the resolved migrations`.

#### Recommended Next Part

- Extend the shared API contract package to admin dashboard, unit inventory, prompt template, and publishing-check payloads so [apps/admin/lib/admin-data.ts](/Users/li/learningByDoing/apps/admin/lib/admin-data.ts) can stop re-declaring backend response types.

### Automation Run: Studio Bootstrap Endpoint

#### Completed This Run

- Finished one full bounded part: `studio bootstrap endpoint for first-render studio data`.
- Added a new aggregated API route that composes unit content, path metadata, learner progress, runner output, AI explanation, and learning pulse in one response:
  - [apps/api/app/routers/studio.py](/Users/li/learningByDoing/apps/api/app/routers/studio.py)
- Added dedicated bootstrap schemas and shared service helpers for learning pulse plus path lookup:
  - [apps/api/app/schemas.py](/Users/li/learningByDoing/apps/api/app/schemas.py)
  - [apps/api/app/services.py](/Users/li/learningByDoing/apps/api/app/services.py)
  - [apps/api/app/routers/progress.py](/Users/li/learningByDoing/apps/api/app/routers/progress.py)
  - [apps/api/app/main.py](/Users/li/learningByDoing/apps/api/app/main.py)
- Replaced the web studio loader fan-out with one fetch to the new bootstrap endpoint while preserving the existing page component contract:
  - [apps/web/lib/learning-data.ts](/Users/li/learningByDoing/apps/web/lib/learning-data.ts)
- Added regression coverage for both the new API endpoint and the single-fetch frontend bootstrap path:
  - [apps/api/tests/test_studio.py](/Users/li/learningByDoing/apps/api/tests/test_studio.py)
  - [apps/web/lib/learning-data.test.ts](/Users/li/learningByDoing/apps/web/lib/learning-data.test.ts)

#### Verification Evidence

- Red phase: `cd apps/api && uv run pytest tests/test_studio.py` -> 2 failures (`404 Not Found` for the missing route), proving the new API contract was not already present.
- Red phase: `npm run test --workspace apps/web -- learning-data.test.ts` -> 1 failure (`Unhandled fetch: GET http://learning-api.test/progress/demo-user/ai-prompt-basics`), proving the web loader still fanned out before the change.
- Green phase: `cd apps/api && uv run pytest tests/test_studio.py tests/test_app.py` -> 6 tests passed.
- Green phase: `npm run test --workspace apps/web -- learning-data.test.ts` -> 5 tests passed.
- Broader API verification: `cd apps/api && uv run pytest` -> 23 tests passed.
- Broader web verification: `npm run test --workspace apps/web` -> 5 tests passed.
- Web type safety: `npm run typecheck --workspace apps/web` -> success.
- Web production build: `npm run build:web` -> success; `/`, `/learn/[pathId]`, `/learn/[pathId]/[unitSlug]`, `/studio`, and `/studio/[unitSlug]` remain server-rendered (`ƒ`) as expected.

#### Blockers / Concerns

- Codex second-opinion review was attempted again, but the local `codex` CLI still failed before producing findings. The command emitted repeated upstream `stream disconnected before completion` retries plus the local state DB warning `migration 20 was previously applied but is missing in the resolved migrations`.
- The new bootstrap endpoint preserves the current architecture where studio page load still triggers runner execution and AI explanation generation on the backend. Request count is reduced, but downstream runner/AI availability is still part of the studio critical path.

#### Recommended Next Part

- Align TypeScript content models with Python API payloads end-to-end, starting with shared typing for the new studio bootstrap payload so the web adapter stops duplicating API contracts.

### Automation Run: Spawned Runner Integration Coverage

#### Completed This Run

- Finished one full bounded part: `automated live integration coverage for API-to-runner delegation with a spawned runner process`.
- Added a dedicated API integration test that exercises `/run` against a real runner subprocess instead of a mocked `httpx.post` boundary:
  - [apps/api/tests/test_run_integration.py](/Users/li/learningByDoing/apps/api/tests/test_run_integration.py)
- Expanded shared API test setup with a reusable live-runner fixture that:
  - allocates an ephemeral localhost port
  - boots the runner from [apps/runner](/Users/li/learningByDoing/apps/runner)
  - polls `/health` for readiness
  - patches the API run router to point at the spawned runner
  - tears the subprocess down cleanly after the test
  - [apps/api/tests/conftest.py](/Users/li/learningByDoing/apps/api/tests/conftest.py)
- Kept the existing mocked proxy tests in [apps/api/tests/test_run.py](/Users/li/learningByDoing/apps/api/tests/test_run.py) fast while moving the slower live delegation proof into its own file and scope.

#### Verification Evidence

- Red phase: `cd apps/api && uv run pytest tests/test_run_integration.py` failed with `fixture 'live_runner_base_url' not found`, proving the new integration test was active before the fixture existed.
- Green phase: `cd apps/api && uv run pytest tests/test_run_integration.py` -> 1 test passed against a spawned runner process.
- Targeted regression check: `cd apps/api && uv run pytest tests/test_run.py tests/test_run_integration.py` -> 6 tests passed.
- Broader API verification: `cd apps/api && uv run pytest` -> 21 tests passed.

#### Blockers / Concerns

- Codex second-opinion review was attempted again, but the local `codex` CLI still did not produce findings. The run emitted the same upstream `stream disconnected before completion` retries plus the local state DB warning `migration 20 was previously applied but is missing in the resolved migrations`.
- The live fixture currently patches [apps/api/app/routers/run.py](/Users/li/learningByDoing/apps/api/app/routers/run.py)'s imported `RUNNER_BASE_URL` constant because runner configuration is captured at import time. The coverage is valid, but a future settings getter would make env-driven integration tests cleaner.

#### Recommended Next Part

- Add a studio bootstrap endpoint so the web app can fetch lesson, progress, run seed, and AI context in one backend call on first render.

### Automation Run: Content Inventory Expansion

#### Completed This Run

- Finished one full bounded part: `content inventory expansion with multi-unit path surfacing`.
- Drafted and integrated 3 new official learning units across the existing learning paths:
  - `python-functions-intro`
  - `ai-answer-checking`
  - `linear-search-intuition`
- Expanded the in-memory API content source of truth, path memberships, admin statuses, and prompt-template unit coverage in:
  - [apps/api/app/services.py](/Users/li/learningByDoing/apps/api/app/services.py)
- Updated API regression coverage for the larger content inventory and admin metrics in:
  - [apps/api/tests/test_admin.py](/Users/li/learningByDoing/apps/api/tests/test_admin.py)
  - [apps/api/tests/test_content.py](/Users/li/learningByDoing/apps/api/tests/test_content.py)
- Extended the web data adapter so each path now carries a full ordered lesson lineup instead of only the first featured unit:
  - [apps/web/lib/learning-data.ts](/Users/li/learningByDoing/apps/web/lib/learning-data.ts)
  - [apps/web/lib/learning-data.test.ts](/Users/li/learningByDoing/apps/web/lib/learning-data.test.ts)
- Surfaced the expanded inventory in the learner UI by:
  - showing dynamic lesson counts on path cards
  - summing practice-task counts from all units on the home page
  - rendering per-path lesson lineup cards with lesson and studio links
  - [apps/web/components/path-card.tsx](/Users/li/learningByDoing/apps/web/components/path-card.tsx)
  - [apps/web/app/page.tsx](/Users/li/learningByDoing/apps/web/app/page.tsx)
  - [apps/web/app/learn/[pathId]/page.tsx](/Users/li/learningByDoing/apps/web/app/learn/[pathId]/page.tsx)
  - [apps/web/app/globals.css](/Users/li/learningByDoing/apps/web/app/globals.css)

#### Verification Evidence

- `cd apps/api && uv run pytest tests/test_content.py` -> 2 tests passed after the red/green cycle.
- `npm run test --workspace apps/web -- learning-data.test.ts` -> 5 tests passed after the red/green cycle.
- `cd apps/api && uv run pytest` -> 20 tests passed.
- `npm run test --workspace apps/web` -> 5 tests passed.
- `npm run typecheck --workspace apps/web` -> success.
- `npm run build:web` -> success; `/`, `/learn/[pathId]`, `/learn/[pathId]/[unitSlug]`, `/studio`, and `/studio/[unitSlug]` render successfully with the learning routes still dynamic (`ƒ`).
- `npm run test --workspace apps/admin` -> 5 tests passed.
- `npm run typecheck --workspace apps/admin` -> success.
- `npm run build --workspace apps/admin` -> success; `/` remains dynamic (`ƒ`) and `/_not-found` stays static.
- Live render verification with the local API/web/runner stack:
  - `curl http://127.0.0.1:3002/learn/python-foundations` HTML contained `第一段 Python`, `第一个函数`, `打开 lesson`, and `打开 studio`.
  - `curl http://127.0.0.1:3002/learn/algorithm-visualization` HTML contained `冒泡排序直觉` and `顺序查找直觉`.
  - `curl http://127.0.0.1:8001/admin/content/units` returned the new slugs `python-functions-intro`, `ai-answer-checking`, and `linear-search-intuition`.
  - `curl http://127.0.0.1:8001/run` for the new function lesson returned `200`, `exit_status="completed"`, and `stdout="你好，小明\n"`.
  - after starting the runner on `127.0.0.1:8002`, the Next dev server logged `GET /studio/python-functions-intro 200`, and the rendered HTML contained `第一个函数`, `not_started`, `当前 code draft`, `AI 陪练视图`, `code-map`, and a live `run-...` id.

#### Blockers / Concerns

- Codex second-opinion review was attempted again, but the local `codex` CLI still failed before producing findings. The command returned repeated upstream `stream disconnected before completion` retries plus the local state DB warning `migration 20 was previously applied but is missing in the resolved migrations`.
- The first live studio verification returned `502 /run` until the separate runner service was started. That is consistent with the current architecture, but it reinforces the need for automated spawned-runner integration coverage.
- gstack `browse` was available on disk but not usable for this run's QA pass: it first failed because `bun` was missing from `PATH`, and after correcting `PATH` it still exited without usable page output. Live verification was completed with direct HTTP render checks instead.

#### Recommended Next Part

- Add automated live integration coverage for API-to-runner delegation with a spawned runner process so studio-level verification does not depend on manual runner startup.

### Automation Run: Admin Editing Workflow

#### Completed This Run

- Finished one full bounded part: `admin editing workflow for unit status, prompt templates, and publishing checks`.
- Turned the admin API from read-only placeholders into editable in-memory workflow state:
  - [apps/api/app/routers/admin.py](/Users/li/learningByDoing/apps/api/app/routers/admin.py)
  - [apps/api/app/schemas.py](/Users/li/learningByDoing/apps/api/app/schemas.py)
  - [apps/api/app/services.py](/Users/li/learningByDoing/apps/api/app/services.py)
- Added API regression coverage for default workflow status, PATCH edits, and reset-safe in-memory admin state:
  - [apps/api/tests/test_admin.py](/Users/li/learningByDoing/apps/api/tests/test_admin.py)
- Wired the admin app to the new PATCH contract and added live edit actions for:
  - unit workflow status
  - prompt template status, description, and unit slug links
  - publishing check `required` / `enabled` toggles
- Reworked the admin UI into editable forms with refreshed status badges and save controls in:
  - [apps/admin/app/actions.ts](/Users/li/learningByDoing/apps/admin/app/actions.ts)
  - [apps/admin/app/page.tsx](/Users/li/learningByDoing/apps/admin/app/page.tsx)
  - [apps/admin/app/globals.css](/Users/li/learningByDoing/apps/admin/app/globals.css)
- Expanded the admin frontend data layer and tests for the new live edit calls in:
  - [apps/admin/lib/admin-data.ts](/Users/li/learningByDoing/apps/admin/lib/admin-data.ts)
  - [apps/admin/lib/admin-data.test.ts](/Users/li/learningByDoing/apps/admin/lib/admin-data.test.ts)

#### Verification Evidence

- `cd apps/api && uv run pytest tests/test_admin.py` -> 7 tests passed.
- `cd apps/api && uv run pytest` -> 19 tests passed.
- `npm run test --workspace apps/admin` -> 5 tests passed.
- `npm run typecheck --workspace apps/admin` -> success.
- `npm run build --workspace apps/admin` -> success; `/` renders dynamically (`ƒ`) and `/_not-found` remains static.
- Live API verification on `127.0.0.1:8001`:
  - `PATCH /admin/content/units/ai-prompt-basics` with `{"content_status":"review"}` returned the updated unit with `content_status="review"`.
  - `PATCH /admin/config/prompt-templates/unit-intro` returned the saved `status="ready"` plus updated description and slug list.
  - `PATCH /admin/config/publishing-checks/seed-sync` returned `required=false` and `enabled=false`.
- Live admin UI verification on `http://127.0.0.1:3001` against the running API:
  - server-rendered HTML contained `工作流状态`, `保存状态`, `保存模板`, and `保存检查项`
  - after the live PATCH calls, the rendered page contained `提示词第一步`, `待审核`, `可用`, `统一生成学习导语，并附带一个贴近日常的比喻。`, and `未启用`

#### Blockers / Concerns

- Codex second-opinion review was attempted again, but the local `codex` CLI still failed before producing findings. The command returned repeated upstream `stream disconnected before completion` retries plus the local state DB warning `migration 20 was previously applied but is missing in the resolved migrations`.
- Admin editing state is still in-memory only. The workflow is real inside a running process, but edits are reset on restart until a persistence slice is built.

#### Recommended Next Part

- Expand official content inventory using [skills/learning-content-pipeline/SKILL.md](/Users/li/learningByDoing/skills/learning-content-pipeline/SKILL.md) so the product has more than seed/demo lessons to operate on.

### Completed This Session

- Finished one full bounded part: `web Phase 1 lesson flow wired to API-shaped fixtures`.
- Added a dedicated web fixture/adapter layer in [apps/web/lib/learning-data.ts](/Users/li/learningByDoing/apps/web/lib/learning-data.ts) to normalize snake_case API payloads into the lesson and studio view models used by the frontend.
- Added reusable presentation blocks in:
  - [apps/web/components/code-block.tsx](/Users/li/learningByDoing/apps/web/components/code-block.tsx)
  - [apps/web/components/path-card.tsx](/Users/li/learningByDoing/apps/web/components/path-card.tsx)
  - [apps/web/components/section-card.tsx](/Users/li/learningByDoing/apps/web/components/section-card.tsx)
- Reworked the web routes into a real learning flow:
  - [apps/web/app/page.tsx](/Users/li/learningByDoing/apps/web/app/page.tsx)
  - [apps/web/app/learn/[pathId]/page.tsx](/Users/li/learningByDoing/apps/web/app/learn/[pathId]/page.tsx)
  - [apps/web/app/learn/[pathId]/[unitSlug]/page.tsx](/Users/li/learningByDoing/apps/web/app/learn/[pathId]/[unitSlug]/page.tsx)
  - [apps/web/app/studio/page.tsx](/Users/li/learningByDoing/apps/web/app/studio/page.tsx)
  - [apps/web/app/studio/[unitSlug]/page.tsx](/Users/li/learningByDoing/apps/web/app/studio/[unitSlug]/page.tsx)
- Expanded the frontend styling and route typing support in:
  - [apps/web/app/globals.css](/Users/li/learningByDoing/apps/web/app/globals.css)
  - [apps/web/next.config.mjs](/Users/li/learningByDoing/apps/web/next.config.mjs)
  - [apps/web/package.json](/Users/li/learningByDoing/apps/web/package.json)
  - [apps/web/tsconfig.json](/Users/li/learningByDoing/apps/web/tsconfig.json)
- Removed the old placeholder topic pages and replaced them with dynamic path + lesson routes:
  - [apps/web/app/learn/python/page.tsx](/Users/li/learningByDoing/apps/web/app/learn/python/page.tsx)
  - [apps/web/app/learn/algorithms/page.tsx](/Users/li/learningByDoing/apps/web/app/learn/algorithms/page.tsx)
  - [apps/web/app/learn/ai/page.tsx](/Users/li/learningByDoing/apps/web/app/learn/ai/page.tsx)
- Fixed the API fixture gap that blocked the web slice by adding the missing AI lesson in [apps/api/app/services.py](/Users/li/learningByDoing/apps/api/app/services.py) and locking it with [apps/api/tests/test_content.py](/Users/li/learningByDoing/apps/api/tests/test_content.py).
- Added fixture-adapter regression coverage in [apps/web/lib/learning-data.test.ts](/Users/li/learningByDoing/apps/web/lib/learning-data.test.ts).

### Verification Evidence

- `cd apps/api && uv run pytest` -> 7 tests passed.
- `npm run test --workspace apps/web` -> 4 tests passed.
- `npm run build:web` -> success; generated `/`, `/learn/[pathId]`, `/learn/[pathId]/[unitSlug]`, `/studio`, and `/studio/[unitSlug]`.
- `browse goto http://localhost:3001` -> 200 with no console messages; home page rendered all three path cards from fixture-backed data.
- `browse goto http://localhost:3001/studio/ai-prompt-basics` -> 200 with no console messages; studio page rendered AI coaching, progress, and back-link to `/learn/ai-basics/ai-prompt-basics`.
- `curl http://localhost:3001/learn/python-foundations/python-variables` -> lesson HTML contains `第一段 Python`, `可视化步骤`, `练习任务`, and `去 studio 运行和复盘`.

### Blockers / Concerns

- Codex second-opinion review could not complete: two `codex exec` attempts failed with repeated upstream `stream disconnected before completion` errors and a local Codex state-db migration warning. No Codex findings were available for this run.
- The web app still reads duplicated local fixtures in [apps/web/lib/learning-data.ts](/Users/li/learningByDoing/apps/web/lib/learning-data.ts); the next bounded part should replace that layer with live API fetching so the frontend stops drifting from [apps/api/app/services.py](/Users/li/learningByDoing/apps/api/app/services.py).

### Recommended Next Part

- Connect the web app to live API contracts end-to-end: replace local lesson/path/progress/AI/run fixtures with fetch-based server data and keep the existing normalized view-model boundary.

### Automation Run: Live API Integration

#### Completed This Run

- Finished one full bounded part: `web live API integration`.
- Replaced the duplicated fixture-backed loader in [apps/web/lib/learning-data.ts](/Users/li/learningByDoing/apps/web/lib/learning-data.ts) with async fetch-backed loaders that normalize live `/content`, `/progress`, `/run`, and `/ai` responses into the existing web view models.
- Switched the learning routes to runtime server rendering so the web app can fetch the FastAPI service without requiring the backend during `next build`:
  - [apps/web/app/page.tsx](/Users/li/learningByDoing/apps/web/app/page.tsx)
  - [apps/web/app/learn/[pathId]/page.tsx](/Users/li/learningByDoing/apps/web/app/learn/[pathId]/page.tsx)
  - [apps/web/app/learn/[pathId]/[unitSlug]/page.tsx](/Users/li/learningByDoing/apps/web/app/learn/[pathId]/[unitSlug]/page.tsx)
  - [apps/web/app/studio/page.tsx](/Users/li/learningByDoing/apps/web/app/studio/page.tsx)
  - [apps/web/app/studio/[unitSlug]/page.tsx](/Users/li/learningByDoing/apps/web/app/studio/[unitSlug]/page.tsx)
- Rewrote the web regression coverage in [apps/web/lib/learning-data.test.ts](/Users/li/learningByDoing/apps/web/lib/learning-data.test.ts) so it now proves live fetch behavior, normalization, studio aggregation, and 404 handling instead of static fixture constants.
- Fixed the live-studio cold-start regression by seeding demo progress in the API source of truth:
  - [apps/api/app/services.py](/Users/li/learningByDoing/apps/api/app/services.py)
  - [apps/api/tests/test_app.py](/Users/li/learningByDoing/apps/api/tests/test_app.py)

#### Verification Evidence

- `npm run test --workspace apps/web -- learning-data.test.ts` -> 4 tests passed after the red/green cycle.
- `npm run test --workspace apps/web` -> 4 tests passed.
- `npm run typecheck --workspace apps/web` -> success.
- `npm run build:web` -> success; `/`, `/learn/[pathId]`, `/learn/[pathId]/[unitSlug]`, `/studio`, and `/studio/[unitSlug]` are now runtime-rendered (`ƒ`) while `/_not-found` stays static.
- `cd apps/api && uv run pytest` -> 8 tests passed.
- `curl http://127.0.0.1:3002/studio/ai-prompt-basics` -> HTML contains `in_progress`, `spot-vague-prompt`, `正在练习把问题说得更具体。`, `AI 陪练视图`, and a live `run-...` job id while the page is served from the Next app against the FastAPI backend.
- `curl http://127.0.0.1:8001/progress/demo-user/ai-prompt-basics` -> API returns the seeded live progress record with `status=in_progress`, `completed_step_ids=["spot-vague-prompt"]`, and the saved note text.

#### Blockers / Concerns

- Codex second-opinion review was attempted again but could not complete because the local `codex` CLI repeatedly failed with upstream `stream disconnected before completion` errors and the same local state-db migration warning. No Codex findings were available for this run.
- The studio page currently fans out across multiple API calls (`/content`, `/progress`, `/run`, `/ai`) on first render. It works, but a backend bootstrap endpoint would reduce coupling and request count.

#### Recommended Next Part

- Build the admin Phase 1 content operations flow: dashboard, unit list, seed action, and prompt/config placeholders.

### Automation Run: Admin Content Operations Flow

#### Completed This Run

- Finished one full bounded part: `admin Phase 1 content operations flow`.
- Replaced the static admin splash page with a live content-ops workspace in:
  - [apps/admin/app/page.tsx](/Users/li/learningByDoing/apps/admin/app/page.tsx)
  - [apps/admin/app/globals.css](/Users/li/learningByDoing/apps/admin/app/globals.css)
  - [apps/admin/app/actions.ts](/Users/li/learningByDoing/apps/admin/app/actions.ts)
- Added the admin fetch/normalization layer and regression coverage in:
  - [apps/admin/lib/admin-data.ts](/Users/li/learningByDoing/apps/admin/lib/admin-data.ts)
  - [apps/admin/lib/admin-data.test.ts](/Users/li/learningByDoing/apps/admin/lib/admin-data.test.ts)
  - [apps/admin/package.json](/Users/li/learningByDoing/apps/admin/package.json)
  - [apps/admin/tsconfig.json](/Users/li/learningByDoing/apps/admin/tsconfig.json)
- Expanded the FastAPI admin contract so the admin UI now has live endpoints for dashboard metrics, content inventory, and prompt/config placeholders:
  - [apps/api/app/routers/admin.py](/Users/li/learningByDoing/apps/api/app/routers/admin.py)
  - [apps/api/app/schemas.py](/Users/li/learningByDoing/apps/api/app/schemas.py)
  - [apps/api/app/services.py](/Users/li/learningByDoing/apps/api/app/services.py)
  - [apps/api/tests/test_admin.py](/Users/li/learningByDoing/apps/api/tests/test_admin.py)

#### Verification Evidence

- `npm run test --workspace apps/admin` -> 2 tests passed.
- `npm run typecheck --workspace apps/admin` -> success.
- `npm run build --workspace apps/admin` -> success; `/` is dynamic (`ƒ`) and `/_not-found` stays static.
- `cd apps/api && uv run pytest` -> 12 tests passed.
- `curl http://127.0.0.1:3001` against the running admin app -> HTML contained `内容工厂`, `课程单元列表`, `第一段 Python`, `提示词第一步`, `提示词模板占位`, `发布配置占位`, and `补种示例内容`.
- `curl http://127.0.0.1:8001/admin/content/units` -> returned all 3 unit inventory rows with `path_titles`, `practice_task_count`, `acceptance_criteria_count`, and `visualization_kind`.
- `curl -X POST http://127.0.0.1:8001/admin/content/seed` -> returned `{"seeded":3,"slugs":["python-variables","ai-prompt-basics","bubble-sort-intuition"]}`.
- `curl http://127.0.0.1:8001/admin/config` -> returned 4 `prompt_templates` and 4 `publishing_checks` placeholder records.

#### Blockers / Concerns

- Codex second-opinion review could not complete again. The local `codex` CLI failed before producing findings because upstream model refresh calls disconnected and the local state DB reported `migration 20 was previously applied but is missing in the resolved migrations`.
- Admin inventory `content_status` is still fixture-fixed to `published` because the project does not yet model draft/review persistence.
- The new admin config surface is intentionally placeholder-only. It provides visibility, not editing or storage-backed configuration yet.

#### Recommended Next Part

- Add stronger runner hardening: resource limits, input validation, and failure-mode tests.

### Automation Run: Runner Hardening and Delegation

#### Completed This Run

- Finished one full bounded part: `runner hardening end-to-end`.
- Added shared request hardening for both execution surfaces so unsafe entrypoints, oversized payloads, unsupported languages, and out-of-range timeouts are rejected before code runs:
  - [apps/runner/app/main.py](/Users/li/learningByDoing/apps/runner/app/main.py)
  - [apps/runner/app/policy.py](/Users/li/learningByDoing/apps/runner/app/policy.py)
  - [apps/api/app/schemas.py](/Users/li/learningByDoing/apps/api/app/schemas.py)
- Hardened the dedicated runner executor so oversized stdout and trace capture are capped instead of growing without bound:
  - [apps/runner/app/executor.py](/Users/li/learningByDoing/apps/runner/app/executor.py)
- Removed the API’s local Python execution path from the product boundary by making [apps/api/app/routers/run.py](/Users/li/learningByDoing/apps/api/app/routers/run.py) proxy to the runner service, with a small runner URL config surface in [apps/api/app/settings.py](/Users/li/learningByDoing/apps/api/app/settings.py).
- Added red/green coverage for validation failures, truncation behavior, trace-frame caps, proxy behavior, and runner unavailability:
  - [apps/runner/tests/test_runner_api.py](/Users/li/learningByDoing/apps/runner/tests/test_runner_api.py)
  - [apps/api/tests/test_run.py](/Users/li/learningByDoing/apps/api/tests/test_run.py)

#### Verification Evidence

- `cd apps/runner && uv run pytest tests/test_runner_api.py` -> 7 tests passed after the red/green cycle.
- `cd apps/api && uv run pytest tests/test_run.py` -> 5 tests passed after the red/green cycle.
- `cd apps/runner && uv run pytest` -> 9 tests passed.
- `cd apps/api && uv run pytest` -> 16 tests passed.
- Live delegation check with a real runner process on `127.0.0.1:8002` plus `TestClient(app)` on the API:
  - `POST /run` with `print('x' * 5000)` returned `200`, a `run-...` job id, `stdout` length `4000`, trailing `[truncated]`, and `stderr` note `stdout truncated after 4000 characters.`
  - `POST /run` with `entrypoint=../escape.py` returned `422` with validation located at `['body', 'entrypoint']`.

#### Blockers / Concerns

- Codex second-opinion review was attempted again but did not return findings. The local `codex` CLI still fails upstream model refresh and sampling with repeated `stream disconnected before completion` errors, plus the local state DB warning about `migration 20` missing from resolved migrations.
- [apps/api/app/routers/runner_support.py](/Users/li/learningByDoing/apps/api/app/routers/runner_support.py) is still a stale third execution path in the codebase. It is no longer on the product path, but it should be removed or quarantined in a cleanup slice to prevent drift.
- The API-to-runner coverage in `pytest` is contract-level with mocked `httpx`; the live delegation proof currently exists as manual verification rather than an automated spawned-runner test.

#### Recommended Next Part

- Add an admin editing workflow for unit status, prompt templates, and publishing checks beyond placeholder visibility.
