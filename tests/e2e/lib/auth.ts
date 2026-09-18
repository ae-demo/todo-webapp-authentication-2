// Shared Thunder sign-in helper for the todo-webapp specs. Not a spec itself.
//
// A fresh visit always attempts a silent (prompt=none) sign-in first
// (todo-webapp/src/authz/session.ts currentUser()); on an environment with no
// existing Thunder session that fails after a burst of retries before the app
// falls back to the real signIn() redirect. That round trip is measured at
// 5-10s live, hence the generous waitFor timeout below.

import type { Page } from "@playwright/test";

export async function login(page: Page, path = "/"): Promise<void> {
  const username = process.env.AEP_E2E_USERNAME;
  const password = process.env.AEP_E2E_PASSWORD;
  if (!username || !password) {
    throw new Error("AEP_E2E_USERNAME / AEP_E2E_PASSWORD must be set");
  }

  // Set up before navigating: TodoList's own mount-time load() fires this GET
  // as soon as /todos renders, and a caller adding a todo immediately after
  // login() returns would otherwise race that still-in-flight request — its
  // resolution overwrites local state and can clobber the just-added row.
  const initialLoad = page.waitForResponse(
    (res) => res.url().includes("/api/me/todos") && res.request().method() === "GET",
    { timeout: 30_000 },
  );

  await page.goto(path);
  const usernameBox = page.getByRole("textbox", { name: "Username" });
  // A still-live Thunder session would let the silent-auth attempt succeed
  // and land straight on /todos, skipping the form — race both outcomes.
  await Promise.race([
    usernameBox.waitFor({ timeout: 20_000 }),
    page.waitForURL(/\/todos/, { timeout: 20_000 }),
  ]);
  if (await usernameBox.isVisible().catch(() => false)) {
    await usernameBox.fill(username);
    await page.getByRole("textbox", { name: "Password" }).fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();
  }
  await page.waitForURL(/\/todos/, { timeout: 20_000 });
  await initialLoad;
}
