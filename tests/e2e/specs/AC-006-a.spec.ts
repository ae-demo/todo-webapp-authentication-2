// spec: tests/validation/test-plan.md § AC-006-a
import { test, expect } from "@playwright/test";
import { login } from "../lib/auth";
import { accessToken, addTodo, allMyTodos } from "../lib/todos";

test("AC-006-a: deleting a todo removes it from the caller's list", async ({ page, request }) => {
  await login(page);
  const title = `ac006a-${Date.now()}`;
  await addTodo(page, title);

  await page.getByRole("cell", { name: title, exact: true }).click();
  await expect(page.getByRole("heading", { name: "Edit Todo" })).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByRole("heading", { name: "My Todos" })).toBeVisible();
  await expect(page.getByRole("cell", { name: title, exact: true })).toHaveCount(0);

  // The list only ever renders the account's first page (see
  // test-plan.md § AC-003-a) — once the account is past that page, a
  // deleted todo's absence from the rendered table is trivially true
  // whether or not the delete actually happened server-side. Confirm the
  // deletion against the full account state directly.
  const token = await accessToken(page);
  const remaining = await allMyTodos(request, token);
  expect(remaining.map((t) => t.title)).not.toContain(title);
});
