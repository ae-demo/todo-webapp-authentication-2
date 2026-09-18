// spec: tests/validation/test-plan.md § AC-003-a
import { test, expect } from "@playwright/test";
import { login } from "../lib/auth";
import { accessToken, addTodo, allMyTodos, myTodosViaApp, renderedTitles } from "../lib/todos";

test("AC-003-a: the todo list screen shows every todo belonging to the signed-in user", async ({
  page,
  request,
}) => {
  await login(page);
  const t1 = `ac003a-1-${Date.now()}`;
  const t2 = `ac003a-2-${Date.now()}`;
  await addTodo(page, t1);
  await addTodo(page, t2);

  // Ground truth is the caller's FULL set from todo-api directly (see
  // lib/todos.ts#allMyTodos) — not just the two just added, since the
  // account may already carry rows from earlier runs.
  const token = await accessToken(page);
  const apiTitles = (await allMyTodos(request, token)).map((t) => t.title).sort();

  // Reload and read whatever the app's own (possibly truncated — see
  // lib/todos.ts#allMyTodos) request actually renders, rather than waiting
  // for either new todo specifically: that wait would itself time out if the
  // app's default page doesn't include them, which is exactly the gap this
  // spec is checking for.
  await myTodosViaApp(page);
  const uiTitles = (await renderedTitles(page)).sort();

  expect(apiTitles).toEqual(expect.arrayContaining([t1, t2]));
  expect(uiTitles).toEqual(apiTitles);
});
