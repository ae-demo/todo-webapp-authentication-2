// The signed-in app shell. wireframes.dsl draws only a `navbar "Todo" "Sign
// out"` on both screens — no sidebar — so this shell carries a Header with the
// brand and a Sign out control in the user menu, and no AppShell.Sidebar slot
// (it renders fine without one: @wso2/oxygen-ui's AppShell only mounts the
// slots it is given). TodoEdit is reached by clicking a row in TodoList, not
// through navigation chrome, so there is nothing for a rail to list anyway.

import type { JSX } from "react";
import { Outlet } from "react-router";
import {
  AppShell as OxygenAppShell,
  ColorSchemeToggle,
  Divider,
  Footer,
  Header,
  UserMenu,
} from "@wso2/oxygen-ui";
import { LogOut } from "@wso2/oxygen-ui-icons-react";
import { useAuthz } from "../authz/gates";
import { signOut } from "../authz/session";
import { APP_NAME } from "../appName";

export function AppShell(): JSX.Element {
  const { username } = useAuthz();

  return (
    <OxygenAppShell>
      <OxygenAppShell.Navbar>
        <Header>
          <Header.Brand>
            <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
          </Header.Brand>
          <Header.Spacer />
          <Header.Actions>
            <ColorSchemeToggle />
            <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />
            <UserMenu>
              <UserMenu.Trigger name={username || "Signed in"} />
              <UserMenu.Header name={username || "Signed in"} email="" />
              <UserMenu.Item icon={<LogOut />} label="Sign out" onClick={() => void signOut()} />
            </UserMenu>
          </Header.Actions>
        </Header>
      </OxygenAppShell.Navbar>

      <OxygenAppShell.Main>
        <Outlet />
      </OxygenAppShell.Main>

      <OxygenAppShell.Footer>
        <Footer>
          <Footer.Copyright>© WSO2 LLC</Footer.Copyright>
        </Footer>
      </OxygenAppShell.Footer>
    </OxygenAppShell>
  );
}
