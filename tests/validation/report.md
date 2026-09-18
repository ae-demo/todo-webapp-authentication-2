# Validation report

- **Issue:** #7
- **Commit:** 3e1d8f353702a5955b00f8ce74ce59922ed729df
- **Generated:** 2026-09-18T06:15:19.771Z
- **Playwright:** 1.61.1

## Summary

| Method | Total | Pass | Fail | Not run |
|---|---|---|---|---|
| e2e | 13 | 13 | 0 | 0 |
| manual (human checklist) | 0 | — | — | — |
| scenario (not validated) | 0 | — | — | — |

## E2E results

| Criterion | Must | Status | Spec | Notes |
|---|---|---|---|---|
| AC-001-a | An unauthenticated visitor is directed to sign in before seeing any todos | ✅ pass | `tests/e2e/specs/AC-001-a.spec.ts` | — |
| AC-001-b | After signing in, a user sees their own todos, not any other user's | ✅ pass | `tests/e2e/specs/AC-001-b.spec.ts` | — |
| AC-001-c | A user's todos persist and are visible again after signing out and back in | ✅ pass | `tests/e2e/specs/AC-001-c.spec.ts` | — |
| AC-002-a | Submitting a title creates a new todo in the caller's list | ✅ pass | `tests/e2e/specs/AC-002-a.spec.ts` | — |
| AC-002-b | A newly added todo starts as not complete | ✅ pass | `tests/e2e/specs/AC-002-b.spec.ts` | — |
| AC-003-a | The todo list screen shows every todo belonging to the signed-in user | ✅ pass | `tests/e2e/specs/AC-003-a.spec.ts` | — |
| AC-004-a | Marking a todo complete updates its status to complete | ✅ pass | `tests/e2e/specs/AC-004-a.spec.ts` | — |
| AC-004-b | Reopening a completed todo updates its status back to not complete | ✅ pass | `tests/e2e/specs/AC-004-b.spec.ts` | — |
| AC-005-a | Editing a todo's title saves the new title and shows it in the list | ✅ pass | `tests/e2e/specs/AC-005-a.spec.ts` | — |
| AC-006-a | Deleting a todo removes it from the caller's list | ✅ pass | `tests/e2e/specs/AC-006-a.spec.ts` | — |
| AC-007-a | Signing out ends the session and returns the user to the sign-in step | ✅ pass | `tests/e2e/specs/AC-007-a.spec.ts` | — |
| AC-007-b | After signing out, the user's todos are no longer visible without signing in again | ✅ pass | `tests/e2e/specs/AC-007-b.spec.ts` | — |
| AC-008-a | One user cannot see another user's todos | ✅ pass | `tests/e2e/specs/AC-008-a.spec.ts` | — |

