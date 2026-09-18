// spec: tests/validation/test-plan.md § AC-002-a
import { test, expect } from "@playwright/test";
import { login } from "../lib/auth";
import { addTodo } from "../lib/todos";

test("AC-002-a: submitting a title creates a new todo in the caller's list", async ({ page }) => {
  await login(page);
  const title = `ac002a-${Date.now()}`;
  await addTodo(page, title);
  await expect(page.getByRole("cell", { name: title, exact: true })).toBeVisible();
});
