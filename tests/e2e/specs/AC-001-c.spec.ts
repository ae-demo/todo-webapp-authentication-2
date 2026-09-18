// spec: tests/validation/test-plan.md § AC-001-c
import { test, expect } from "@playwright/test";
import { login } from "../lib/auth";
import { addTodo } from "../lib/todos";

test("AC-001-c: a user's todos persist and are visible again after signing out and back in", async ({
  page,
}) => {
  // 1. Sign in, add a uniquely-titled todo.
  await login(page);
  const title = `ac001c-${Date.now()}`;
  await addTodo(page, title);

  // 2. Sign out, then sign in again as the same user. The sign-out landing
  // page is broken (see AC-007-a) but the local session is cleared either
  // way, so signing back in still proves persistence across the round trip.
  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await login(page);

  // 3. The todo created before sign-out is still there.
  await expect(page.getByRole("cell", { name: title, exact: true })).toBeVisible();
});
