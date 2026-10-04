import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSkippedLines } from "../src/snippet.ts";

test("skipped ranges use snippet positions and merge overlaps", () => {
  assert.deepEqual(
    [...parseSkippedLines("3-5, 8, 4-6", 10).lines].sort((a, b) => a - b),
    [3, 4, 5, 6, 8],
  );
  assert.deepEqual(
    [...parseSkippedLines(" 2 – 4 , 7 ", 10).lines],
    [2, 3, 4, 7],
  );
});

test("empty input keeps every line visible", () => {
  assert.equal(parseSkippedLines(" ", 10).error, null);
  assert.equal(parseSkippedLines("", 10).lines.size, 0);
});

test("invalid or entirely hidden snippets cannot be exported", () => {
  for (const input of [
    "0",
    "9-3",
    "11",
    "1-10",
    "1,",
    "abc",
    "1.5",
    "-2",
    "1-999999999",
  ]) {
    const result = parseSkippedLines(input, 10);
    assert.ok(result.error, input);
    assert.equal(result.lines.size, 0, input);
  }
});

test("first and last lines can be skipped while a line stays visible", () => {
  assert.deepEqual([...parseSkippedLines("1, 10", 10).lines], [1, 10]);
  assert.ok(parseSkippedLines("1", 1).error);
});

test("skip ranges use displayed numbers with a non-default start line", () => {
  assert.deepEqual([...parseSkippedLines("44-46, 49", 10, 42).lines], [3, 4, 5, 8]);
  assert.deepEqual([...parseSkippedLines("42, 51", 10, 42).lines], [1, 10]);
  for (const input of ["3-5", "41", "52", "42-51"]) {
    assert.ok(parseSkippedLines(input, 10, 42).error, input);
  }
  assert.match(parseSkippedLines("3-5", 10, 42).error ?? "", /42 and 51/);
});
