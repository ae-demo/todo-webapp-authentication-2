// THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS (thunder-authentication §5).
// Adapted from assets/screens.example.ts — SCREEN_ROUTES below are THIS app's
// two wireframe screens, in rail/walk order (TodoList -> TodoEdit).
//
// TodoList loads GET /me/todos — the caller's own todos, which is the reach
// the screen draws. TodoEdit has no GET /me/todos/{id} operation in
// todo-api's contract, so the row clicked in TodoList hands its Todo down via
// router state — but a direct/refreshed visit (src/pages/TodoEdit.tsx) falls
// back to the SAME GET /me/todos call TodoList makes, to find the matching
// row. `loads` here names that real dependency, so a caller holding no
// project scope at all (the `?role=` no-role visitor) is correctly excluded
// from `reachableScreens` and lands on NoAccess, rather than being counted
// reachable on `signedIn` alone, landing on the edit screen, and having its
// fallback fetch refused into Forbidden instead.
//
// Neither flow has a `role`-less screen: every screen in wireframes.dsl's one
// flow sits behind the sign-in guard, so nothing here is `public`.

import { canCall } from "./rules";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  readonly key: string;
  readonly label: string;
  readonly path: string;
  readonly loads: OperationKey | null;
  readonly public?: boolean;
}

export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  { key: "todo-list", label: "My Todos", path: "/todos", loads: "GET /me/todos" },
  { key: "todo-edit", label: "Edit Todo", path: "/todos/:id", loads: "GET /me/todos" },
];

for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

export function reachableScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return SCREEN_ROUTES.filter((screen) => {
    if (screen.public) return true;
    if (screen.loads === null) return signedIn;
    return canCall(OPERATIONS[screen.loads], scopes, signedIn);
  });
}
