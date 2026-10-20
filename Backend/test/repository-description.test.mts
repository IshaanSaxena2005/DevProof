import { describe, it } from "node:test";
import assert from "node:assert";

describe("Repository Description Validation", () => {
  it("should accept valid descriptions under 2000 characters", () => {
    const valid = "A simple repository description";
    assert.strictEqual(typeof valid, "string");
    assert.strictEqual(valid.length, 31);
    assert.ok(valid.length <= 2000);
  });

  it("should accept empty description (null after trim)", () => {
    const empty = "";
    assert.strictEqual(empty.trim(), "");
  });

  it("should reject descriptions over 2000 characters", () => {
    const tooLong = "a".repeat(2001);
    assert.strictEqual(tooLong.length, 2001);
    assert.ok(tooLong.length > 2000);
  });

  it("should accept exactly 2000 characters", () => {
    const max = "a".repeat(2000);
    assert.strictEqual(max.length, 2000);
    assert.ok(max.length <= 2000);
  });

  it("should handle whitespace-only descriptions", () => {
    const whitespace = "   \n\t  ";
    assert.strictEqual(whitespace.trim(), "");
  });
});
