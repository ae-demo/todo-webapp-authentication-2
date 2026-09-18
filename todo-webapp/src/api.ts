// The todo-api client. Same-origin baseUrl — nginx proxies /api to the
// sibling (react-webapp: Same-origin API proxy). Authorization is entirely
// src/authz/client.ts's job: this file adds nothing of its own about it.

import createClient, { type Middleware } from "openapi-fetch";
import type { paths } from "./generated/todo-api";
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
