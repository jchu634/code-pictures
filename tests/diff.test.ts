import assert from "node:assert/strict";
import { test } from "node:test";
import { buildScreenshotDiff } from "../src/diff.ts";

const file = (contents: string) => ({
  name: "example.ts",
  contents,
  lang: "typescript",
});

test("identical snippets keep all context visible without marking changes", () => {
  const diff = buildScreenshotDiff(
    file("first\nsecond"),
    file("first\nsecond"),
  );
  assert.equal(diff.splitLineCount, 2);
  assert.equal(diff.hunks.length, 1);
  assert.deepEqual(diff.hunks[0]?.hunkContent, [
    { type: "context", lines: 2, additionLineIndex: 0, deletionLineIndex: 0 },
  ]);
});

test("empty snippets keep both columns renderable", () => {
  for (const [before, after] of [
    ["", "added"],
    ["removed", ""],
    ["", ""],
  ]) {
    const diff = buildScreenshotDiff(file(before), file(after));
    assert.equal(diff.type, "change");
    assert.ok(diff.splitLineCount > 0);
    assert.ok(diff.hunks.length > 0);
  }
});

test("changed snippets preserve real additions and deletions", () => {
  const diff = buildScreenshotDiff(file("same\nold"), file("same\nnew\nextra"));
  assert.deepEqual(diff.deletionLines, ["same\n", "old"]);
  assert.deepEqual(diff.additionLines, ["same\n", "new\n", "extra"]);
  assert.ok(
    diff.hunks.some(
      (hunk) => hunk.additionLines === 2 && hunk.deletionLines === 1,
    ),
  );
});
test("screenshot diffs omit missing-newline notices on both sides", () => {
  const diff = buildScreenshotDiff(file("old"), file("new"));
  assert.ok(diff.hunks.length > 0);
  for (const hunk of diff.hunks) {
    assert.equal(hunk.noEOFCRAdditions, false);
    assert.equal(hunk.noEOFCRDeletions, false);
  }
});
