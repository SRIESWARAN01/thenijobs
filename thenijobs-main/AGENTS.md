# THENIJOBS Agent Rules

These rules apply to every code or content change in this repository.

1. Start with a short gap analysis before broad feature work. Name what exists, what is missing, assumptions, ambiguities, and likely files touched.
2. Keep output concise. For large work, split implementation into reviewable blocks.
3. Surface framework, library, naming, and data-model choices before changing them.
4. When asked for a feature prompt, produce the prompt only and do not implement that feature in the same turn.
5. Keep folder discipline. Do not create broad catch-all helpers unless the app already has that pattern.
6. Use TypeScript throughout. Avoid `any`; when unavoidable, add a `TODO(type):` note explaining the reason.
7. Firestore is the canonical store. Do not commit parallel local JSON data. Use scripts under `scripts/seed/` for seed data.
8. New collection write paths must include matching Firestore and Storage rule updates when relevant.
9. Audit-worthy actions must write to `activityLogs` in the current app schema. Approvals, rejections, role changes, deletions, and broadcast sends are audit-worthy.
10. Stop on real ambiguity that would create user-visible or data-model risk.

Current app notes:
- The app currently uses root-level Next.js structure, not a monorepo.
- Current role names are `job_seeker`, `employer`, `business_owner`, `admin`, and `super_admin`.
- Current chat collection is `conversations`; current audit collection is `activityLogs`.
- Keep those names unless a migration plan is approved.
