import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveTheme } from "@pierre/diffs";
import { themes, themeStyle } from "../src/themes.ts";

test("frame colors match the actual syntax themes in both modes", async () => {
  for (const theme of themes) {
    for (const mode of ["dark", "light"] as const) {
      const palette = theme[mode];
      const resolved = await resolveTheme(palette.name);
      // GitHub light uses the equivalent shorthand #fff.
      const background = resolved.bg === "#fff" ? "#ffffff" : resolved.bg;
      assert.equal(background?.toLowerCase(), palette.background);
      assert.equal(resolved.fg?.toLowerCase(), palette.foreground);
      assert.deepEqual(themeStyle(palette), {
        "--color-code-background": palette.background,
        "--color-code-foreground": palette.foreground,
      });
    }
  }
});
