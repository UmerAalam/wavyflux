import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ThemeProvider } from "./components/ThemeProvider";
import SlowedReverb from "./pages/SlowedReverb";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <SlowedReverb />
    </ThemeProvider>
  </StrictMode>,
);
