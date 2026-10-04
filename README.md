# Codepictures

A browser app for making code screenshots. Built with React, Vite, Tailwind CSS, and [Pierre Diffs](https://diffs.com).

- Live, syntax-highlighted code editing using Pierre's `File` and `EditProvider`.
- Dark and light modes.
- Custom starting line numbers and skipped lines with ellipsis markers.
- Intel One Mono, JetBrains Mono, Fira Code, IBM Plex Mono, and Source Code Pro from Google Fonts.
- An optional filename-only window header. Edit the filename directly in the header, or in Window settings when the header is hidden.
- Drag the bottom-right handle to resize the code window, enter dimensions, or choose a standard window size. Focus the handle and use arrow keys to resize by 10 pixels, or Shift and arrow keys for 40 pixels.
- Window dimensions cannot shrink below the visible code. Font and content changes expand the window as needed, and presets that would clip code are disabled.
- PNG downloads at 1×, 2×, or 3×. Only the code window is exported, at its selected dimensions. The live view scales to fit smaller screens.

Code is kept in browser memory and never uploaded. Reloading clears the snippet and settings. Google Fonts and their stylesheets are fetched from Google.

## Styling

Layout and component styles use Tailwind utilities in the React components. Shared colors and the dark-mode variant are defined in `src/index.css`. `src/frame.ts` shares window utilities between the live editor and the PNG renderer. Pierre renders inside a shadow root, so font settings, number offsets, and skipped rows use its `unsafeCSS` option in `src/snippet.ts`.

## Run locally

Use Node.js 24 and pnpm 11.

```sh
pnpm install
pnpm dev
```

```sh
pnpm test
pnpm lint
pnpm build
pnpm preview
```

## Skip lines

Enter the displayed line numbers, such as `44-46, 49` when the start line is `42`. Each contiguous range becomes one ellipsis row. Skipping `44-46` displays `42, 43, ···, 47, ...`. Changing the start line also changes the valid skip range.

## GitHub Pages

1. Push this project to a GitHub repository with a `main` branch.
2. In **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` or run **Deploy to GitHub Pages** from the Actions tab.

The workflow installs dependencies, runs tests and lint, builds the app, and deploys `dist`. It gets Vite's base path from `actions/configure-pages`, supporting both repository sites and root sites. If the default branch has another name, change the branch filter in `.github/workflows/deploy.yml`.

For another static host, run `pnpm build` and publish `dist`. Set `VITE_BASE_PATH` before building if serving from a subdirectory.
