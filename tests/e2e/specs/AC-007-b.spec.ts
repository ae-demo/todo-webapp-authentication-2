// spec: tests/validation/test-plan.md § AC-007-b
import { test, expect } from "@playwright/test";
import { login } from "../lib/auth";
import { addTodo } from "../lib/todos";

test("AC-007-b: after signing out, the user's todos are no longer visible without signing in again", async ({
  page,
}) => {
  await login(page);
  const title = `ac007b-${Date.now()}`;
  await addTodo(page, title);

  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();

  // Regardless of where sign-out itself lands (see AC-007-a), the local
  // session is cleared — a fresh visit must not show the todo again without
  // signing back in.
  await page.goto("/");
  await expect(page).toHaveURL(/\/gate\/signin/, { timeout: 20_000 });
  await expect(page.getByRole("cell", { name: title, exact: true })).toHaveCount(0);
});
