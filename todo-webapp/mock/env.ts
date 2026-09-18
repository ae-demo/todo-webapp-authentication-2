// The keys the platform actually emits for this component (react-webapp's
// key table): this app's own USER_AUTH_* OIDC keys, and nothing else — there
// is no external-kind dependency and no configurations.env default. No
// USER_AUTH_JWKS_URL: the browser never validates a token, so src/env.ts does
// not declare it and mock mode does not carry it either.
export const mockEnv = {
  USER_AUTH_CLIENT_ID: "mock-client",
  USER_AUTH_ISSUER: "https://mock-idp.test",
  // The OIDC scopes are `group` and `ou`, singular, plus the project's own
  // catalog handles from specs/design/security.json (todos:read, todos:submit
  // — there is no todos:read-all in this project).
  USER_AUTH_SCOPES: "openid profile email group ou todos:read todos:submit",
  USER_AUTH_RESOURCE: "https://mock-idp.test/resources/todo-webapp-authentication-2",
};
