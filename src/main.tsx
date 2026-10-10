import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { preloadHighlighter } from "@pierre/diffs";

// The editor and diff previews share this Shiki highlighter.
await preloadHighlighter({
  themes: ["github-dark", "github-light"],
  langs: ["typescript", "c", "cpp"],
});
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
