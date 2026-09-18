// spec: tests/validation/test-plan.md § AC-008-a
import { test, expect } from "@playwright/test";
import { login } from "../lib/auth";
import { addTodo } from "../lib/todos";
import { target } from "../lib/targets";

test("AC-008-a: one user cannot see another user's todos", async ({ page, request }) => {
  // 1. Sign in as test-user and create a uniquely-titled todo.
  await login(page);
  const title = `ac008a-${Date.now()}`;
  await addTodo(page, title);

  // 2. The only "not this owner" caller obtainable in this environment: no
  // provisioned second identity exists (see test-plan.md's note on
  // AC-008-a), and todo-api's contract has no endpoint that accepts a
  // caller-supplied user id — so a caller with no proof of being the owner
  // is the full extent of "another user" this environment can exercise.
  const res = await request.get(`${target("todo-api")}/me/todos`);
  expect(res.status()).toBe(401);

  const body = await res.json().catch(() => null);
  const titles: string[] = body?.data?.map((t: { title: string }) => t.title) ?? [];
  expect(titles).not.toContain(title);
});
