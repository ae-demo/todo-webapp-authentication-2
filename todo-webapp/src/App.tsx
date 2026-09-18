// Adapted from thunder-authentication's assets/App.example.tsx. The routing
// STRUCTURE below is prescribed by that skill:
//
//   NoAccess sits ABOVE the shell route and REPLACES it.
//   Forbidden sits INSIDE the shell, at /forbidden.
//   /forbidden is wired into authz/client once, from inside the router.
//   Every gated route is wrapped in <RequireOperation>, the operation taken
//     from SCREEN_ROUTES.
//   /callback is routed OUTSIDE the AuthzProvider: there is no session to
//     read until the redirect has been processed.
//
// This app's one flow has no role-less screen (wireframes.dsl's "Manage
// todos" flow carries `role "User"` and both screens sit in it), so there is
// no PUBLIC_SCREENS list here — every screen is behind the sign-in guard.
//
// main.tsx already wraps this component in <BrowserRouter>, per
// oxygen-ui-design-system's main.tsx wiring, so App() does not open its own.

import { useEffect, type ReactElement } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router";
import {
  AuthzProvider,
  Forbidden,
  NoAccess,
  RequireOperation,
  useAuthz,
  useScopes,
} from "./authz/gates";
import { SCREEN_ROUTES, reachableScreens } from "./authz/screens";
import { setForbiddenNavigator } from "./authz/client";
import { signIn } from "./authz/session";
import { AppShell } from "./shell/AppShell";
import { APP_NAME } from "./appName";
import { CallbackPage } from "./pages/Callback";
import { TodoListPage } from "./pages/TodoList";
import { TodoEditPage } from "./pages/TodoEdit";

/** YOUR pages, keyed by the screen keys src/authz/screens.ts declares. */
const PAGE_BY_KEY: Record<string, ReactElement> = {
  "todo-list": <TodoListPage />,
  "todo-edit": <TodoEditPage />,
};

export function App(): ReactElement {
  return (
    <>
      <ForbiddenWiring />
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="*"
          element={
            <AuthzProvider fallback={<Splash />}>
              <SignedIn />
            </AuthzProvider>
          }
        />
      </Routes>
    </>
  );
}

/**
 * Hands src/authz/client.ts the route a refusal goes to. ONCE, from inside
 * the router and above every route, so it is wired before the first request
 * can be answered.
 */
function ForbiddenWiring(): null {
  const navigate = useNavigate();
  useEffect(() => {
    setForbiddenNavigator(() => navigate("/forbidden", { replace: true }));
  }, [navigate]);
  return null;
}

function Splash(): ReactElement {
  return (
    <main>
      <h1>{APP_NAME}</h1>
      <p>Checking your session…</p>
    </main>
  );
}

function SignedIn(): ReactElement {
  const { signedIn } = useAuthz();
  const scopes = useScopes();

  // The load-time guard. Only a MISSING session starts a sign-in: currentUser()
  // has already tried a silent renew, and signing in on a merely expired token
  // re-logs the user in on every visit.
  useEffect(() => {
    if (!signedIn) void signIn();
  }, [signedIn]);

  if (!signedIn) return <Splash />;

  const reachable = reachableScreens(scopes, signedIn);

  // NoAccess REPLACES the shell — there is only one role in this project
  // (User, granted todos:read + todos:submit), so this branch is unreachable
  // for a correctly provisioned account, but a caller with neither grant
  // still gets the honest "nothing for you" page rather than an empty shell.
  if (reachable.length === 0) return <NoAccess appName={APP_NAME} />;

  const landing = reachable[0].path;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={landing} replace />} />
        {SCREEN_ROUTES.map((screen) => {
          const page = PAGE_BY_KEY[screen.key];
          if (screen.loads === null) {
            return <Route key={screen.key} path={screen.path} element={page} />;
          }
          return (
            <Route
              key={screen.key}
              element={<RequireOperation op={screen.loads} screen={screen.label} />}
            >
              <Route path={screen.path} element={page} />
            </Route>
          );
        })}
        {/* Forbidden is INSIDE the shell: the rail the caller can use stays. */}
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<Navigate to={landing} replace />} />
      </Route>
    </Routes>
  );
}
