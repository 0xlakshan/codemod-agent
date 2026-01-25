import { describe, it, expect } from "vitest";
import { compareVersions, isMajorVersionBump } from "../src/utils/version";

describe("version utilities", () => {
  describe("compareVersions", () => {
    it("should return 0 for equal versions", () => {
      expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
      expect(compareVersions("2.5.3", "2.5.3")).toBe(0);
    });

    it("should return -1 when first version is lower", () => {
      expect(compareVersions("1.0.0", "2.0.0")).toBe(-1);
      expect(compareVersions("1.5.0", "1.6.0")).toBe(-1);
      expect(compareVersions("1.0.1", "1.0.2")).toBe(-1);
    });

    it("should return 1 when first version is higher", () => {
      expect(compareVersions("2.0.0", "1.0.0")).toBe(1);
      expect(compareVersions("1.6.0", "1.5.0")).toBe(1);
      expect(compareVersions("1.0.2", "1.0.1")).toBe(1);
    });

    it("should handle version prefixes", () => {
      expect(compareVersions("^1.0.0", "^2.0.0")).toBe(-1);
      expect(compareVersions("~1.5.0", "~1.4.0")).toBe(1);
      expect(compareVersions(">=1.0.0", ">=1.0.0")).toBe(0);
    });
  });

  describe("isMajorVersionBump", () => {
    it("should detect major version bumps", () => {
      expect(isMajorVersionBump("1.0.0", "2.0.0")).toBe(true);
      expect(isMajorVersionBump("2.5.3", "3.0.0")).toBe(true);
    });

    it("should return false for minor/patch bumps", () => {
      expect(isMajorVersionBump("1.0.0", "1.1.0")).toBe(false);
      expect(isMajorVersionBump("1.0.0", "1.0.1")).toBe(false);
    });

    it("should handle version prefixes", () => {
      expect(isMajorVersionBump("^1.0.0", "^2.0.0")).toBe(true);
      expect(isMajorVersionBump("~1.5.0", "~1.6.0")).toBe(false);
    });
  });
});
