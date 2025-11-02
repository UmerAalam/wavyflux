import { createFileRoute } from "@tanstack/react-router";
import SlowedReverb from "../pages/SlowedReverb";

export const Route = createFileRoute("/")({
  component: SlowedReverb,
});
