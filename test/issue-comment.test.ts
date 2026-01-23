import { describe, it, expect } from "vitest";
import { parseCommand } from "../src/handlers/issue-comment";

describe("issue-comment handler", () => {
  describe("parseCommand", () => {
    it("should parse valid /apply commands", () => {
      expect(parseCommand("/apply react-18-migration")).toBe(
        "react-18-migration",
      );
      expect(parseCommand("/apply test-codemod")).toBe("test-codemod");
      expect(parseCommand("/apply my_codemod_123")).toBe("my_codemod_123");
    });

    it("should handle whitespace", () => {
      expect(parseCommand("  /apply test-codemod  ")).toBe("test-codemod");
      expect(parseCommand("/apply   test-codemod")).toBe("test-codemod");
    });

    it("should return null for invalid commands", () => {
      expect(parseCommand("/apply")).toBeNull();
      expect(parseCommand("apply test-codemod")).toBeNull();
      expect(parseCommand("/apply test codemod")).toBeNull();
      expect(parseCommand("some other comment")).toBeNull();
    });
  });
});
