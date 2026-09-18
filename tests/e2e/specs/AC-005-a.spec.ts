// spec: tests/validation/test-plan.md § AC-005-a
import { test, expect } from "@playwright/test";
import { login } from "../lib/auth";
import { accessToken, addTodo, allMyTodos } from "../lib/todos";

test("AC-005-a: editing a todo's title saves the new title and shows it in the list", async ({
  page,
  request,
}) => {
  await login(page);
  const title = `ac005a-${Date.now()}`;
  const newTitle = `${title}-edited`;
  await addTodo(page, title);

  await page.getByRole("cell", { name: title, exact: true }).click();
  await expect(page.getByRole("heading", { name: "Edit Todo" })).toBeVisible();
  await page.getByRole("textbox", { name: "Title" }).fill(newTitle);
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("heading", { name: "My Todos" })).toBeVisible();

  // Confirm the save reached the backend, to distinguish "not saved" from
  // "saved but not rendered" — the list only ever shows the account's first
  // page (see test-plan.md § AC-003-a), so once the account is past it a
  // just-edited (newest) row can be saved correctly yet still not show.
  const token = await accessToken(page);
  const stored = await allMyTodos(request, token);
  expect(stored.map((t) => t.title)).toContain(newTitle);

  await expect(page.getByRole("cell", { name: newTitle, exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: title, exact: true })).toHaveCount(0);
});
