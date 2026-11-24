import { describe, expect, it } from "vitest";
import { moveIndex, typeahead } from "../../src/internal/nav";

describe("moveIndex", () => {
  it.each([
    ["next", 0, 1], ["next", 2, 0], ["prev", 0, 2], ["first", 1, 0], ["last", 0, 2], ["next", -1, 0], ["prev", -1, 2],
  ] as const)("%s from %i is %i", (key, from, to) => expect(moveIndex(key, from, [false, false, false])).toBe(to));
  it("skips disabled entries, including at the edges", () => {
    expect(moveIndex("next", 0, [false, true, false])).toBe(2);
    expect(moveIndex("first", 2, [true, false, false])).toBe(1);
    expect(moveIndex("last", 0, [false, false, true])).toBe(1);
  });
  it("returns -1 when there is nowhere to go", () => {
    expect(moveIndex("next", 0, [true, true])).toBe(-1);
    expect(moveIndex("next", -1, [])).toBe(-1);
  });
});

describe("typeahead", () => {
  const labels = ["Save", "Share", "Send", "Delete"];
  const none = labels.map(() => false);
  it("a repeated letter cycles and wraps", () => {
    expect(typeahead("s", 0, labels, none)).toBe(1);
    expect(typeahead("sss", 2, labels, none)).toBe(0);
  });
  it("a longer query keeps a current match", () => expect(typeahead("sh", 1, labels, none)).toBe(1));
  it("skips disabled, ignores case, -1 on no match", () => {
    expect(typeahead("S", 0, labels, [false, true, false, false])).toBe(2);
    expect(typeahead("x", 0, labels, none)).toBe(-1);
  });
});
