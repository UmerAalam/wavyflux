import * as React from "react";
import { createRootRoute } from "@tanstack/react-router";
import { ThemeProvider } from "../components/ThemeProvider";
import NotFoundPage from "../pages/NotFoundPage";
import SlowedReverb from "../pages/SlowedReverb";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
});

function RootComponent() {
  return (
    <React.Fragment>
      <ThemeProvider>
        <SlowedReverb />
      </ThemeProvider>
    </React.Fragment>
  );
}
