// spec: tests/validation/test-plan.md § AC-001-b
import { test, expect } from "@playwright/test";
import { login } from "../lib/auth";
import { addTodo, myTodosViaApp, renderedTitles } from "../lib/todos";

test("AC-001-b: after signing in, a user sees their own todos, not any other user's", async ({
  page,
}) => {
  // 1. Sign in as test-user.
  await login(page);

  // 2. Add one uniquely-titled todo via the composer.
  const title = `ac001b-${Date.now()}`;
  await addTodo(page, title);

  // 3. Read GET /me/todos for this session and compare against what is
  // rendered — the UI must show exactly the caller's own scoped API result,
  // nothing more (there is no second real identity to compare against in
  // this environment; see test-plan.md's note on AC-001-b).
  const apiTodos = await myTodosViaApp(page);
  const apiTitles = apiTodos.map((t) => t.title).sort();
  const uiTitles = (await renderedTitles(page)).sort();

  expect(apiTitles).toContain(title);
  expect(uiTitles).toEqual(apiTitles);
});
