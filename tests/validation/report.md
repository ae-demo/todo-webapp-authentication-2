# Validation report

- **Issue:** #7
- **Commit:** 45ce2229d98629ab5c45931422b14d200c8bad88
- **Generated:** 2026-09-18T05:54:09.706Z
- **Playwright:** 1.61.1

## Summary

| Method | Total | Pass | Fail | Not run |
|---|---|---|---|---|
| e2e | 13 | 8 | 5 | 0 |
| manual (human checklist) | 0 | — | — | — |
| scenario (not validated) | 0 | — | — | — |

## E2E results

| Criterion | Must | Status | Spec | Notes |
|---|---|---|---|---|
| AC-001-a | An unauthenticated visitor is directed to sign in before seeing any todos | ✅ pass | `tests/e2e/specs/AC-001-a.spec.ts` | — |
| AC-001-b | After signing in, a user sees their own todos, not any other user's | ❌ fail | `tests/e2e/specs/AC-001-b.spec.ts` | — |
| AC-001-c | A user's todos persist and are visible again after signing out and back in | ❌ fail | `tests/e2e/specs/AC-001-c.spec.ts` | — |
| AC-002-a | Submitting a title creates a new todo in the caller's list | ✅ pass | `tests/e2e/specs/AC-002-a.spec.ts` | — |
| AC-002-b | A newly added todo starts as not complete | ✅ pass | `tests/e2e/specs/AC-002-b.spec.ts` | — |
| AC-003-a | The todo list screen shows every todo belonging to the signed-in user | ❌ fail | `tests/e2e/specs/AC-003-a.spec.ts` | — |
| AC-004-a | Marking a todo complete updates its status to complete | ✅ pass | `tests/e2e/specs/AC-004-a.spec.ts` | — |
| AC-004-b | Reopening a completed todo updates its status back to not complete | ✅ pass | `tests/e2e/specs/AC-004-b.spec.ts` | — |
| AC-005-a | Editing a todo's title saves the new title and shows it in the list | ❌ fail | `tests/e2e/specs/AC-005-a.spec.ts` | — |
| AC-006-a | Deleting a todo removes it from the caller's list | ✅ pass | `tests/e2e/specs/AC-006-a.spec.ts` | — |
| AC-007-a | Signing out ends the session and returns the user to the sign-in step | ❌ fail | `tests/e2e/specs/AC-007-a.spec.ts` | — |
| AC-007-b | After signing out, the user's todos are no longer visible without signing in again | ✅ pass | `tests/e2e/specs/AC-007-b.spec.ts` | — |
| AC-008-a | One user cannot see another user's todos | ✅ pass | `tests/e2e/specs/AC-008-a.spec.ts` | — |

## Failures

### AC-001-b — After signing in, a user sees their own todos, not any other user's

Spec: `tests/e2e/specs/AC-001-b.spec.ts`
Location: `AC-001-b.spec.ts:6`

```
Error: expect(received).toContain(expected) // indexOf

Expected value: "ac001b-1789710552380"
Received array: ["ac001b-1789709264237", "ac001b-1789709282760", "ac001b-1789709476919", "ac001b-1789709495085", "ac001c-1789709300649", "ac001c-1789709413324", "ac001c-1789709444882", "ac002a-1789709513518", "ac002a-1789709544384", "ac002b-1789709527022", …]
```

### AC-001-c — A user's todos persist and are visible again after signing out and back in

Spec: `tests/e2e/specs/AC-001-c.spec.ts`
Location: `AC-001-c.spec.ts:6`

```
Test timeout of 30000ms exceeded.
```

### AC-003-a — The todo list screen shows every todo belonging to the signed-in user

Spec: `tests/e2e/specs/AC-003-a.spec.ts`
Location: `AC-003-a.spec.ts:6`

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  - 25
+ Received  +  0

  Array [
    "ac001b-1789709264237",
    "ac001b-1789709282760",
    "ac001b-1789709476919",
    "ac001b-1789709495085",
-   "ac001b-1789710044862",
-   "ac001b-1789710123020",
-   "ac001b-1789710141821",
-   "ac001b-1789710552380",
    "ac001c-1789709300649",
    "ac001c-1789709413324",
    "ac001c-1789709444882",
-   "ac001c-1789710183921",
-   "ac001c-1789710226786",
-   "ac001c-1789710567383",
```

### AC-005-a — Editing a todo's title saves the new title and shows it in the list

Spec: `tests/e2e/specs/AC-005-a.spec.ts`
Location: `AC-005-a.spec.ts:6`

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('cell', { name: 'ac005a-1789710671782-edited', exact: true })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('cell', { name: 'ac005a-1789710671782-edited', exact: true })

```

### AC-007-a — Signing out ends the session and returns the user to the sign-in step

Spec: `tests/e2e/specs/AC-007-a.spec.ts`
Location: `AC-007-a.spec.ts:5`

```
Test timeout of 30000ms exceeded.
```

