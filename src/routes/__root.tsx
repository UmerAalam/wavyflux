import * as React from "react";
import { createRootRoute } from "@tanstack/react-router";
import { ThemeProvider } from "../components/ThemeProvider";
import NotFoundPage from "../pages/NotFoundPage";
import SlowedReverb from "../pages/SlowedReverb";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFoundPage,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "WavyFlux — Slowed + Reverb Audio Generator",
      },
    ],
  }),
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
