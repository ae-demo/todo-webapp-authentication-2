// spec: tests/validation/test-plan.md § AC-002-b
import { test, expect } from "@playwright/test";
import { login } from "../lib/auth";
import { addTodo, rowByTitle } from "../lib/todos";

test("AC-002-b: a newly added todo starts as not complete", async ({ page }) => {
  await login(page);
  const title = `ac002b-${Date.now()}`;
  await addTodo(page, title);
  await expect(rowByTitle(page, title).getByRole("button", { name: "Open" })).toBeVisible();
});
