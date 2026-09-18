import { useEffect, type JSX } from "react";
import { useNavigate } from "react-router";
import { handleCallback } from "../authz/session";

/** The OIDC redirect target: processes the code exchange once, then lands home. */
export function CallbackPage(): JSX.Element {
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    void handleCallback()
      .catch((err) => {
        console.error("authz: sign-in callback failed", err);
      })
      .finally(() => {
        if (live) navigate("/", { replace: true });
      });
    return () => {
      live = false;
    };
  }, [navigate]);

  return (
    <main>
      <p>Signing you in…</p>
    </main>
  );
}
