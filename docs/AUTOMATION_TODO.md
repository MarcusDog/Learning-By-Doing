# Automation Todo

## Completed

- [x] Establish root workspace structure for `apps/` and `packages/`.
- [x] Create the `learning-content-pipeline` project skill for standardized lesson production.
- [x] Implement shared runtime contracts in `packages/shared-types`.
- [x] Implement `packages/content-schema` sample learning unit validation.
- [x] Implement FastAPI Phase 1 foundation for auth, content, progress, AI explain, admin seed, and run endpoints.
- [x] Implement Python runner foundation with execution tracing, timeout handling, and dual `/run` + `/execute` compatibility.
- [x] Build the web Phase 1 lesson flow: landing page, path cards, lesson detail page, and code studio page wired to API-shaped fixtures.
- [x] Connect the web app to live API contracts end-to-end and remove duplicated frontend lesson/progress/run/AI fixtures.
- [x] Build the admin Phase 1 content operations flow: dashboard, unit list, seed action, and prompt/config placeholders.
- [x] Add stronger runner hardening: input validation, payload caps, API-to-runner delegation, and failure-mode tests.
- [x] Add an admin editing workflow for unit status, prompt templates, and publishing checks beyond placeholder visibility.
- [x] Expand official content inventory using `skills/learning-content-pipeline` and surface multi-unit path lineups in the learner UI.
- [x] Add automated live integration coverage for API-to-runner delegation with a spawned runner process.
- [x] Add a studio bootstrap endpoint so the web app stops fan-out fetching `/content`, `/progress`, `/run`, and `/ai` on first render.
- [x] Align TypeScript learner content and studio bootstrap contracts with the Python API payloads through `packages/shared-types`.
- [x] Extend the shared TypeScript API contract layer to admin content-ops payloads so `apps/admin` stops duplicating FastAPI response models.
- [x] Tighten the admin backend schema layer so `visualization_kind` and the seed response use explicit response models instead of a plain `str`/untyped dict boundary.
- [x] Persist admin content-ops workflow state beyond in-memory process lifetime so unit statuses, prompt templates, and publishing checks survive API restarts.
- [x] Persist learner auth and progress state beyond in-memory stores so registrations and lesson progress survive API restarts.
- [x] Replace hardcoded demo learner resolution in `/auth/me`, `/progress/me`, and studio bootstrap with a shared current-user/session resolver.
- [x] Surface current-user session state in the web learner shell and navigation so learner identity/progress are visible beyond the studio bootstrap path.
- [x] Make learner progress inspectable across landing, path, lesson, and studio surfaces with per-unit progress states and trustworthy cross-page summaries.
- [x] Complete the admin/content operations workflow with actionable create, review, publish, and empty/error/loading states so content ops feel product-complete.
- [x] Verify responsive behavior across the learner and admin surfaces, then fix the browser QA issues found in that pass.
- [x] Fix admin server-action redirect handling so content-ops mutations show the intended success/error flash states instead of leaking `NEXT_REDIRECT`.

## Next Bounded Parts

- [ ] Run a deeper end-to-end QA pass across the critical learner, studio, auth/current-user, progress, and admin happy paths, then fix the issues found in that same pass.

## Quality Follow-Ups

- [ ] Add explicit operator-facing diagnostics or repair handling for malformed persisted admin or learner state files instead of silently falling back to defaults.
- [x] Expand learner-state regression coverage through `/progress/me` and studio bootstrap for reloaded non-demo users.
- [ ] Add lifecycle cleanup or rate-limiting for transient guest sessions beyond the current TTL + capped eviction guardrail.
- [ ] Add rendered route/component regression coverage for learner progress surfaces instead of relying mostly on data-layer aggregation tests plus typecheck/build.
- [ ] Add rendered route coverage for the admin workflow surface itself; this run locked behavior at the API/data/build level rather than with route component tests.
- [ ] Expand admin server-action regression coverage beyond `createUnitAction` so seed/review/publish/template/check redirects are locked at the action layer too.
- [ ] Stabilize or replace the local gstack browse daemon for automation runs; it intermittently reused stale sessions and left port `18800` occupied during this QA pass.

## Website Completion Checklist

- [ ] Learner shell and navigation feel complete across landing, catalog, path, lesson, and studio routes.
- [x] Auth/current-user flows are visible and understandable in the web UI, not only in backend/bootstrap plumbing.
- [x] Learner progress is inspectable and trustworthy across refreshes, restarts, and cross-page movement.
- [x] Admin/content operations cover create, edit, review, publish, and empty/error/loading states.
- [x] Responsive behavior is verified across the learner and admin surfaces.
- [ ] End-to-end QA covers critical learner, studio, auth, progress, and admin workflows without major regressions.
- [ ] Foundation is stable enough to begin the four major curriculum tracks.
