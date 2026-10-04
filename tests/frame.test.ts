import assert from "node:assert/strict";
import { test } from "node:test";
import { constrainWindowSize } from "../src/frame.ts";

test("all resize paths clamp dimensions to the content minimum", () => {
  assert.deepEqual(constrainWindowSize({ width: 320, height: 200 }, { width: 710, height: 485 }), { width: 710, height: 485 });
  assert.deepEqual(constrainWindowSize({ width: 800, height: 600 }, { width: 710, height: 485 }), { width: 800, height: 600 });
});

test("large snippets remain visible beyond the normal size limit", () => {
  assert.deepEqual(constrainWindowSize({ width: 800, height: 600 }, { width: 2600, height: 1900 }), { width: 2600, height: 1900 });
});
