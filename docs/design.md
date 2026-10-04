# App structure

The user edits a Pierre File directly in the code window. The active editing session owns its document and undo history. A ref observes changes without feeding them back into the File. Line count updates keep skipped-range validation current.

The complete document stays in Pierre, with selected rows hidden to preserve highlighting context for multiline comments and strings. Skip ranges use the displayed line numbers and convert to internal snippet positions during validation.

`snippet.ts` owns range validation and Pierre shadow-root CSS. `App.tsx` owns the toolbar, settings sidebar, optional filename header, and pointer/keyboard resizing. Tailwind utilities own the app layout. `frame.ts` shares window classes and size constraints. It measures visible rows using DOM ranges after rendering and font loading, accounting for the gutter and preview zoom. Every resize path clamps to these content dimensions, and editing expands the frame when needed.

`exportScreenshot.ts` renders a detached, non-editable Pierre File from the current document. This keeps selections and carets out of PNGs without ending the live editing session. The renderer uses the chosen dimensions and header visibility, waits for fonts and highlighting, and always cleans up its staging DOM. Vite's configurable base path supports repository and account GitHub Pages sites.

No backend or account is needed. Google Fonts are fetched externally; snippet text stays in the browser.
