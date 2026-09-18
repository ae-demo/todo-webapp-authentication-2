# Validation test plan — issue #7

Target app: `todo-webapp` (primary, browser specs), `todo-api` (direct API spec
for AC-008-a). Sign-in is via Thunder (OIDC Authorization Code + PKCE); the
single test account `test-user` (role `User`) comes from the milestone's roles
gate ticket (issue #3) and is read from `AEP_E2E_USERNAME` / `AEP_E2E_PASSWORD`
at run time — never hardcoded.

**Only one test account exists for this project** (`security.json` declares a
single role, `User`, with one test user). AC-001-b and AC-008-a both ask about
one user's data being invisible to another; with no second account and no
self-registration flow in this app (sign-in is entirely delegated to Thunder,
confirmed by reading `todo-webapp/src/authz/session.ts` and the
`thunder-authentication` skill), a live two-real-identity comparison isn't
possible. Both specs are still authored, against the strongest proxy available:
todo-api's contract (`specs/design/components/todo-api/openapi.yaml`) exposes
only `/me/todos` — there is no endpoint, on any path, that accepts a caller-
supplied user id, so the only way to see "another user's" todos would be to
authenticate as them. AC-008-a therefore asserts that the API refuses to return
any todos to a caller that isn't the owner (no bearer token at all), which is
the only "not this owner" caller obtainable in this environment. AC-001-b
combines that with a UI-vs-API cross-check: what the signed-in user's screen
renders is exactly the set `GET /me/todos` returns for their own token, nothing
more.

Exploration (2026-09-18, via playwright-cli against the live deployment)
surfaced two behaviours worth recording up front, both left as observed rather
than worked around:

- **Sign-in redirect is delayed ~5-10s.** On a fresh visit, `currentUser()`
  (`todo-webapp/src/authz/session.ts`) always attempts a silent
  (`prompt=none`)  sign-in first; on an environment with no existing Thunder
  session this fails after a burst of retries before the app falls back to
  the real `signIn()` redirect. Specs that expect the sign-in page wait with a
  generous timeout instead of treating the delay as a failure.
- **Sign-out lands on an IdP error page**, `invalid post_logout_redirect_uri`,
  instead of returning to the app. See AC-007-a below — this is reported as a
  failing criterion, not healed around.
- **The todo list never shows more than the account's first 20 todos, ever
  again, once it has more than 20.** `todo-api`'s `GET /me/todos` defaults to
  `limit=20, offset=0` (`openapi.yaml`), and `todo-webapp/src/pages/
  TodoList.tsx`'s `load()` calls it with no params and never follows `next` —
  so once an account passes 20 todos, its 21st+ todo (and every one after)
  never renders on any fresh page load, no matter how it was created. This
  environment's `test-user` account crossed that threshold partway through
  this run (each spec adds 1-2 uniquely-titled todos to a persistent
  environment, per the "unique test data" convention, and this account also
  carries earlier validation cycles' rows). From that point on it stays
  crossed — the count only grows — so this is not a flake: **AC-003-a fails
  deterministically and permanently from here on**, and it explains three
  further, otherwise-unrelated-looking failures below (AC-001-b, AC-001-c,
  AC-005-a) — all four are one root cause, not four bugs. See AC-003-a for
  the primary evidence and lib/todos.ts's `allMyTodos` for how the specs get
  ground truth past the app's own cap.

## AC-001-a — An unauthenticated visitor is directed to sign in before seeing any todos

- Target: todo-webapp (primary)
- Steps:
  1. Navigate to `/` with no prior session.
  2. Wait for the Thunder sign-in page (the visitor is bounced there after the
     silent-auth attempt above).
- Assert: the browser ends up on the Thunder `Sign In` form (URL contains
  `/gate/signin` or a heading `Sign In` is visible) and no todo list content is
  ever rendered.
- Source of truth: live app (silent-auth delay is only observable live);
  `todo-webapp/src/App.tsx` (`SignedIn` calls `signIn()` when `!signedIn`).

## AC-001-b — After signing in, a user sees their own todos, not any other user's

- Target: todo-webapp (primary) + todo-api (cross-check)
- Steps:
  1. Sign in as `test-user`.
  2. Add one uniquely-titled todo via the composer.
  3. Read `GET /me/todos` for the same session's token (via the browser's own
     fetch, observed through the API) — compare the full set of titles
     rendered in the list against the API's `data[].title`.
- Assert: the created todo appears in the list, and the rendered set of titles
  is exactly the API's caller-scoped set (nothing rendered that the API didn't
  return for this token, nothing missing).
- Source of truth: `todo-webapp/src/pages/TodoList.tsx` (renders exactly
  `GET /me/todos`'s `data`); live app for the actual values.
- Caveat: see the note above — this cannot compare against a second real
  identity; it demonstrates the UI never shows more than the caller's own
  scoped API response.
- **Observed live: this fails once the account is past 20 todos** — the
  20-item page cap (see the note above, and AC-003-a) means the just-added
  (newest) todo is absent from both the API response the app itself requests
  and the render built from it. This is the same root cause as AC-003-a, not
  a second bug.

## AC-001-c — A user's todos persist and are visible again after signing out and back in

- Target: todo-webapp (primary)
- Steps:
  1. Sign in, add a uniquely-titled todo.
  2. Sign out (via the user menu), then sign in again as the same user.
  3. Reload the todo list.
- Assert: the todo created in step 1 is still present after the round trip.
- Source of truth: live app. (Sign-out's landing page is broken per AC-007-a;
  this spec signs back in regardless, since the local session is cleared
  either way — confirmed live.)
- **Observed live: this fails once the account is past 20 todos**, for the
  same reason as AC-001-b — the sign-in redirect is a fresh page load, so the
  post-sign-in list render is subject to the same 20-item page cap as any
  other reload. Not a persistence bug: the todo is still there server-side
  (see AC-003-a/AC-005-a's API cross-checks), it just never renders again.

## AC-002-a — Submitting a title creates a new todo in the caller's list

- Target: todo-webapp (primary)
- Steps: sign in; fill the composer with a unique title; click Add.
- Assert: a new row with that title appears in the table.
- Source of truth: `todo-webapp/src/pages/TodoList.tsx` `handleAdd`.

## AC-002-b — A newly added todo starts as not complete

- Target: todo-webapp (primary)
- Steps: same as AC-002-a.
- Assert: the new row's status chip reads "Open" (not "Done").
- Source of truth: `todo-webapp/src/pages/TodoList.tsx` (`completed: false`
  default from `POST /me/todos`).

## AC-003-a — The todo list screen shows every todo belonging to the signed-in user

- Target: todo-webapp (primary) + todo-api (cross-check)
- Steps:
  1. Sign in; add two uniquely-titled todos via the UI.
  2. Read `GET /me/todos` for the session.
  3. Compare rendered titles against the API's full set.
- Assert: every title the API returns for the caller is rendered in the table
  (set equality, not just the two just added — the account may carry rows
  from earlier runs).
- Source of truth: `todo-webapp/src/pages/TodoList.tsx` `load()`.
- **Observed live: this fails.** `todo-api`'s `GET /me/todos` defaults to
  `limit=20` (`specs/design/components/todo-api/openapi.yaml`), and
  `TodoList.tsx`'s `load()` calls `todoApi.GET("/me/todos", {})` with no
  `limit`/`offset` override and never follows the response's `next` link. The
  spec fetches the caller's true full set directly from todo-api with
  `limit=100` (`lib/todos.ts#allMyTodos`) as ground truth; once that set
  passes 20 rows, the app's own list is missing every row past the 20th, and
  the gap persists on every subsequent visit — this account has already
  crossed that line (see the note at the top of this document). Reproduced
  three times independently, deterministically (growing by exactly the
  number of new todos added each time), not a flake.

## AC-004-a — Marking a todo complete updates its status to complete

- Target: todo-webapp (primary)
- Steps: sign in; add a todo; click its status chip ("Open").
- Assert: the chip now reads "Done".
- Source of truth: `todo-webapp/src/pages/TodoList.tsx` `handleToggle`.

## AC-004-b — Reopening a completed todo updates its status back to not complete

- Target: todo-webapp (primary)
- Steps: continue from AC-004-a's flow within the same spec: click the "Done"
  chip again.
- Assert: the chip now reads "Open".
- Source of truth: same as AC-004-a.

## AC-005-a — Editing a todo's title saves the new title and shows it in the list

- Target: todo-webapp (primary)
- Steps: sign in; add a todo; open it; change the Title field; click Save.
- Assert: back on the list, the row shows the new title (old title gone).
- Source of truth: `todo-webapp/src/pages/TodoEdit.tsx` `handleSave`.
- Also asserts, via `todo-api` directly (`lib/todos.ts#allMyTodos`), that the
  new title was actually persisted server-side — this distinguishes "not
  saved" from "saved but not rendered" (see below).
- **Observed live: this fails once the account is past 20 todos.** The save
  itself succeeds (the API-cross-check assertion passes every time) but
  `handleSave` navigates back to `/todos`, remounting `TodoListPage` and
  re-triggering the same capped `load()` as AC-003-a — since the just-edited
  row is the newest, it falls outside the 20-item page and the criterion's
  "shows it in the list" half fails. Same root cause as AC-003-a, confirmed
  twice independently, deterministically.

## AC-006-a — Deleting a todo removes it from the caller's list

- Target: todo-webapp (primary)
- Steps: sign in; add a todo; open it; click Delete.
- Assert: back on the list, the deleted title is no longer present; also
  confirmed against `todo-api` directly (`lib/todos.ts#allMyTodos`) that the
  todo is actually gone. The direct-API check is necessary once the account
  is past the 20-item page (see AC-003-a): a deleted row is, by then, already
  excluded from the rendered list before it's even deleted (it was never on
  the first page to begin with), so the list-only assertion alone would pass
  regardless of whether the delete worked.
- Source of truth: `todo-webapp/src/pages/TodoEdit.tsx` `handleDelete`.

## AC-007-a — Signing out ends the session and returns the user to the sign-in step

- Target: todo-webapp (primary)
- Steps: sign in; open the user menu; click "Sign out".
- Assert: the browser ends up back at a sign-in prompt (Thunder `Sign In`
  form).
- **Observed live: this fails.** `signOut()`
  (`todo-webapp/src/authz/session.ts`) calls `userManager.signoutRedirect()`,
  which redirects to Thunder's `/oauth2/logout` with
  `post_logout_redirect_uri=<app origin, no trailing slash>`. Thunder rejects
  it with `invalid post_logout_redirect_uri` and the user is stranded on that
  IdP error page — never routed back to sign-in. Confirmed reproducible twice
  independently during manual exploration, then twice more via the automated
  spec.

## AC-007-b — After signing out, the user's todos are no longer visible without signing in again

- Target: todo-webapp (primary)
- Steps: sign in; add a uniquely-titled todo; sign out (per AC-007-a, this
  lands on the IdP error page); navigate back to the app root without
  re-authenticating.
- Assert: the todo list/table is never shown without a fresh sign-in (the app
  shows its splash/sign-in redirect, not the table) — confirmed live: the
  local session is cleared by `signOut()`'s `removeUser()` fallback path even
  though the redirect target itself errors (see AC-007-a).
- Source of truth: live app.

## AC-008-a — One user cannot see another user's todos

- Target: todo-api (direct API)
- Steps:
  1. Sign in as `test-user` via the API (obtain a bearer token through the
     browser flow) and create a uniquely-titled todo.
  2. Call `GET /me/todos` on the same endpoint with no `Authorization` header
     at all — the only caller identity obtainable in this environment that is
     not this owner.
- Assert: the unauthenticated call is rejected (`401`) and returns no todo
  data — i.e., nothing is visible to a caller who isn't proven to be the
  owner. Per the openapi contract, no endpoint anywhere accepts a caller-
  supplied user id, so this is the full extent of "another caller" that can be
  exercised without a second provisioned identity.
- Source of truth: `specs/design/components/todo-api/openapi.yaml` (security
  scheme, `401` response); confirmed live via `curl`.
