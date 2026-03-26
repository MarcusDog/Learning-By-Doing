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

## Next Bounded Parts

- [ ] Replace hardcoded demo learner resolution in `/auth/me`, `/progress/me`, and studio bootstrap with a shared current-user/session resolver.

## Quality Follow-Ups

- [ ] Add explicit operator-facing diagnostics or repair handling for malformed persisted admin or learner state files instead of silently falling back to defaults.
- [ ] Expand learner-state regression coverage through `/progress/me` and studio bootstrap for reloaded non-demo users.
