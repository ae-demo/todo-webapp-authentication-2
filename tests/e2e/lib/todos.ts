// Shared todo-list actions for the todo-webapp specs. Not a spec itself.

import { expect, type APIRequestContext, type Locator, type Page } from "@playwright/test";
import { target } from "./targets";

export async function addTodo(page: Page, title: string): Promise<void> {
  await page.getByRole("textbox", { name: "What needs doing?" }).fill(title);
  await page.getByRole("button", { name: "Add" }).click();
  await page.getByRole("cell", { name: title, exact: true }).waitFor();
}

export function rowByTitle(page: Page, title: string): Locator {
  return page.locator("tr", { hasText: title });
}

/** All rendered "Title" column values, read off every table cell. */
export async function renderedTitles(page: Page): Promise<string[]> {
  const cells = await page.getByRole("cell").allInnerTexts();
  return cells
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t !== "Open" && t !== "Done");
}

/**
 * Reloads the list and captures the same GET /me/todos response the app's
 * own TodoList.load() makes — the caller-scoped source of truth the UI is
 * rendered from.
 */
export async function myTodosViaApp(page: Page): Promise<{ id: string; title: string }[]> {
  const [response] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes("/api/me/todos") && res.request().method() === "GET",
    ),
    page.reload(),
  ]);
  const body = await response.json();
  // The response event can fire a tick before React commits the resulting
  // render; wait for the loading spinner to be gone rather than reading the
  // table immediately.
  await expect(page.getByRole("progressbar")).toHaveCount(0, { timeout: 15_000 });
  return body.data;
}

/** The signed-in session's bearer token, read out of Thunder's own storage key. */
export async function accessToken(page: Page): Promise<string> {
  const token = await page.evaluate(() => {
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("oidc.user:")) {
        return (JSON.parse(localStorage.getItem(key) as string) as { access_token: string })
          .access_token;
      }
    }
    return null;
  });
  if (!token) throw new Error("no Thunder session in localStorage — call login(page) first");
  return token;
}

/**
 * The caller's FULL todo set, fetched directly against todo-api rather than
 * through the app — todo-api's `/me/todos` defaults to `limit=20`
 * (openapi.yaml), and the webapp's own TodoList.load() never raises it or
 * follows `next`, so this is the only way to see past the app's own default
 * page. Used as ground truth for "every todo belonging to the user".
 */
export async function allMyTodos(
  request: APIRequestContext,
  token: string,
): Promise<{ id: string; title: string }[]> {
  const res = await request.get(`${target("todo-api")}/me/todos?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  return body.data;
}
