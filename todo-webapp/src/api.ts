// The todo-api client. Same-origin baseUrl — nginx proxies /api to the
// sibling (react-webapp: Same-origin API proxy). Authorization is entirely
// src/authz/client.ts's job: this file adds nothing of its own about it.

import createClient, { type Middleware } from "openapi-fetch";
import type { components, paths } from "./generated/todo-api";
import { authorizationHeader, classifyResponse, ForbiddenError } from "./authz/client";

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const header = await authorizationHeader();
    if (header) request.headers.set("Authorization", header);
    return request;
  },
  async onResponse({ response }) {
    if ((await classifyResponse(response.status)) === "forbidden") {
      throw new ForbiddenError(response.status);
    }
    return response;
  },
};

export const todoApi = createClient<paths>({ baseUrl: "/api" });
todoApi.use(authMiddleware);

type Todo = components["schemas"]["Todo"];

// openapi.yaml caps /me/todos at limit=100 and defaults to 20, so a single
// request never shows the caller's whole list once it grows past the page
// size — the account accumulates todos across every run in this environment.
// Walk `next` until the API itself says there is no more, so "every todo
// belonging to the signed-in user" holds regardless of how many there are.
const MAX_PAGE_SIZE = 100;

export async function fetchAllMyTodos(): Promise<Todo[] | null> {
  const all: Todo[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await todoApi.GET("/me/todos", {
      params: { query: { limit: MAX_PAGE_SIZE, offset } },
    });
    if (error) return null;
    all.push(...data.data);
    if (!data.next) return all;
    offset += MAX_PAGE_SIZE;
  }
}
