import assert from "node:assert/strict";
import { test } from "node:test";
import { getSharedHighlighter } from "@pierre/diffs";
import { languages } from "../src/languages.ts";

test("every selectable language loads in the shared Shiki highlighter", async () => {
  const highlighter = await getSharedHighlighter({
    themes: ["github-dark", "github-light"],
    langs: languages.map(([language]) => language),
  });
  for (const [lang] of languages) {
    assert.doesNotThrow(() =>
      highlighter.codeToTokens("int main() { return 0; }", {
        lang,
        theme: "github-dark",
      }),
    );
  }
});

test("C and C++ produce colored syntax without changing the source", async () => {
  const highlighter = await getSharedHighlighter({
    themes: ["github-dark", "github-light"],
    langs: ["c", "cpp"],
  });
  for (const [lang, source] of [
    ["c", '#include <stdio.h>\nint main(void) { printf("hello"); return 0; }'],
    ["cpp", '#include <iostream>\nint main() { std::cout << "hello"; return 0; }'],
  ]) {
    assert.ok(languages.some(([language]) => language === lang));
    for (const theme of ["github-dark", "github-light"]) {
      const { tokens } = highlighter.codeToTokens(source, { lang, theme });
      assert.equal(
        tokens.map((line) => line.map((token) => token.content).join("")).join("\n"),
        source,
      );
      assert.ok(new Set(tokens.flat().map((token) => token.color)).size > 1);
    }
  }
});
