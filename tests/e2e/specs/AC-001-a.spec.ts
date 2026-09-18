// spec: tests/validation/test-plan.md § AC-001-a
import { test, expect } from "@playwright/test";

test("AC-001-a: an unauthenticated visitor is directed to sign in before seeing any todos", async ({
  page,
}) => {
  // 1. Navigate to / with no prior session.
  await page.goto("/");

  // 2. The app tries a silent sign-in first (fails, no existing Thunder
  // session) then falls back to the real redirect — allow a generous window.
  await expect(page).toHaveURL(/\/gate\/signin/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();

  // No todo content is ever rendered en route.
  await expect(page.getByRole("heading", { name: "My Todos" })).toHaveCount(0);
});
