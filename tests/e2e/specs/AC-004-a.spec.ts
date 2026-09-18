// spec: tests/validation/test-plan.md § AC-004-a
import { test, expect } from "@playwright/test";
import { login } from "../lib/auth";
import { addTodo, rowByTitle } from "../lib/todos";

test("AC-004-a: marking a todo complete updates its status to complete", async ({ page }) => {
  await login(page);
  const title = `ac004a-${Date.now()}`;
  await addTodo(page, title);

  const row = rowByTitle(page, title);
  await row.getByRole("button", { name: "Open" }).click();
  await expect(row.getByRole("button", { name: "Done" })).toBeVisible();
});
