import assert from "node:assert/strict";
import { test } from "node:test";
import { constrainWindowSize } from "../src/frame.ts";

test("small windows retain their requested dimensions", () => {
  assert.deepEqual(constrainWindowSize({ width: 120, height: 80 }), { width: 120, height: 80 });
});

test("resizing keeps dimensions positive and within export limits", () => {
  assert.deepEqual(constrainWindowSize({ width: -10, height: 0 }), { width: 1, height: 1 });
  assert.deepEqual(constrainWindowSize({ width: 2600, height: 1900 }), { width: 2400, height: 1600 });
});

test("content minimum allows a compact single line and preserves its padding", () => {
  assert.deepEqual(
    constrainWindowSize({ width: 120, height: 1 }, { width: 73, height: 69 }),
    { width: 120, height: 69 },
  );
  assert.deepEqual(
    constrainWindowSize({ width: 120, height: 1 }, { width: 73, height: 93 }),
    { width: 120, height: 93 },
  );
});

test("content remains visible when its minimum exceeds the normal export limit", () => {
  assert.deepEqual(
    constrainWindowSize({ width: 1, height: 1 }, { width: 73, height: 1800 }),
    { width: 73, height: 1800 },
  );
});
