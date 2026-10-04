import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { preloadHighlighter } from "@pierre/diffs";

// Preload before mounting so the first preview contains highlighted code.
await preloadHighlighter({
  themes: ["github-dark", "github-light"],
  langs: ["typescript"],
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
