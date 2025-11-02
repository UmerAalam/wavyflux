import * as React from "react";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { ThemeProvider } from "../components/ThemeProvider";
import NotFoundPage from "../pages/NotFoundPage";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
});

function RootComponent() {
  return (
    <React.Fragment>
      <ThemeProvider>
        <Outlet />
      </ThemeProvider>
    </React.Fragment>
  );
}
