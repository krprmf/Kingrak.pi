import { test } from "node:test";
import assert from "node:assert/strict";
import { getEmotion, isEmotionKey, FALLBACK_EMOTION } from "./emotions";

test("known mood returns its creature", () => {
  assert.equal(getEmotion("joy").name, "Sunny");
});

test("unknown, null and empty moods return the fallback", () => {
  for (const m of ["not-a-mood", null, undefined, ""]) {
    assert.equal(getEmotion(m), FALLBACK_EMOTION);
  }
});

test("isEmotionKey narrows only real keys", () => {
  assert.equal(isEmotionKey("anger"), true);
  assert.equal(isEmotionKey("toString"), false);
});
