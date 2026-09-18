// spec: tests/validation/test-plan.md § AC-007-a
import { test, expect } from "@playwright/test";
import { login } from "../lib/auth";

test("AC-007-a: signing out ends the session and returns the user to the sign-in step", async ({
  page,
}) => {
  await login(page);

  await page.getByRole("button", { name: "Account" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();

  // Observed live: signOut() redirects to Thunder's /oauth2/logout with a
  // post_logout_redirect_uri Thunder rejects, stranding the user on an IdP
  // error page instead of the sign-in step. See test-plan.md § AC-007-a.
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible({ timeout: 20_000 });
});
