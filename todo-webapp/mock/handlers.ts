// The service half of mock mode (mock/authz/gateway.ts is the gateway half —
// see react-webapp's mock-mode.md). One handler per todo-api operation this
// app calls. State lives in module scope, which resets on any full page load
// — a reload, a typed URL, an in-app navigation carries a change forward.
//
// No scope check here: whether an operation may be called at all is
// mock/authz/gateway.ts's answer, read from openapi.yaml. What a handler owes
// is its path's reach — `/me/todos` is the caller's own rows, resolved from
// the mock identity, never a query parameter.

import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/todo-api";

type Todo = components["schemas"]["Todo"];

// The caller mock/authz/session.ts mints by default: the first (and only)
// role in specs/design/security.json is "User", whose slug is "user", so the
// default persona's sub is "mock-user". Seeding one row owned by someone else
// proves /me/todos never leaks it.
export const mockCaller = { userId: "mock-user" };

const now = new Date().toISOString();

let nextId = 4;
let todos: (Todo & { owner: string })[] = [
  {
    id: "1",
    title: "Buy groceries",
    completed: false,
    createdAt: now,
    updatedAt: now,
    owner: mockCaller.userId,
  },
  {
    id: "2",
    title: "Finish report",
    completed: true,
    createdAt: now,
    updatedAt: now,
    owner: mockCaller.userId,
  },
  {
    id: "3",
    title: "Someone else's todo",
    completed: false,
    createdAt: now,
    updatedAt: now,
    owner: "someone-else",
  },
];

function strip(todo: Todo & { owner: string }): Todo {
  const { owner: _owner, ...rest } = todo;
  return rest;
}

export const handlers = [
  http.get("/api/me/todos", () => {
    const mine = todos.filter((t) => t.owner === mockCaller.userId).map(strip);
    return HttpResponse.json({ count: mine.length, next: null, previous: null, data: mine });
  }),

  http.post("/api/me/todos", async ({ request }) => {
    const body = (await request.json()) as { title?: string };
    if (!body?.title || body.title.trim().length === 0) {
      return HttpResponse.json(
        { code: 400, message: "title is required" },
        { status: 400 },
      );
    }
    const created: Todo & { owner: string } = {
      id: String(nextId++),
      title: body.title,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      owner: mockCaller.userId,
    };
    todos = [...todos, created];
    return HttpResponse.json(strip(created), { status: 201 });
  }),

  http.patch("/api/me/todos/:id", async ({ params, request }) => {
    const body = (await request.json()) as { title?: string; completed?: boolean };
    const index = todos.findIndex(
      (t) => t.id === params.id && t.owner === mockCaller.userId,
    );
    if (index === -1) {
      return HttpResponse.json({ code: 404, message: "no such todo" }, { status: 404 });
    }
    const updated = {
      ...todos[index],
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.completed !== undefined ? { completed: body.completed } : {}),
      updatedAt: new Date().toISOString(),
    };
    todos = [...todos.slice(0, index), updated, ...todos.slice(index + 1)];
    return HttpResponse.json(strip(updated));
  }),

  http.delete("/api/me/todos/:id", ({ params }) => {
    const index = todos.findIndex(
      (t) => t.id === params.id && t.owner === mockCaller.userId,
    );
    if (index === -1) {
      return HttpResponse.json({ code: 404, message: "no such todo" }, { status: 404 });
    }
    todos = [...todos.slice(0, index), ...todos.slice(index + 1)];
    return new HttpResponse(null, { status: 204 });
  }),
];
