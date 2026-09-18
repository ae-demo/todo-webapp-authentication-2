// spec: tests/validation/test-plan.md § AC-004-b
import { test, expect } from "@playwright/test";
import { login } from "../lib/auth";
import { addTodo, rowByTitle } from "../lib/todos";

test("AC-004-b: reopening a completed todo updates its status back to not complete", async ({
  page,
}) => {
  await login(page);
  const title = `ac004b-${Date.now()}`;
  await addTodo(page, title);

  const row = rowByTitle(page, title);
  await row.getByRole("button", { name: "Open" }).click();
  await expect(row.getByRole("button", { name: "Done" })).toBeVisible();

  await row.getByRole("button", { name: "Done" }).click();
  await expect(row.getByRole("button", { name: "Open" })).toBeVisible();
});
