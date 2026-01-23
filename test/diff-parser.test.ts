import { describe, it, expect } from "vitest";
import { parseDependencyChanges } from "../src/services/diff-parser";

describe("diff-parser", () => {
  describe("parseDependencyChanges", () => {
    it("should parse dependency version changes", () => {
      const patch = `
@@ -10,7 +10,7 @@
   "dependencies": {
-    "react": "^17.0.0",
+    "react": "^18.0.0",
     "lodash": "^4.17.21"
   }
`;
      const changes = parseDependencyChanges(patch);
      expect(changes).toHaveLength(1);
      expect(changes[0]).toEqual({
        name: "react",
        oldVersion: "^17.0.0",
        newVersion: "^18.0.0",
        type: "dependencies",
      });
    });

    it("should handle multiple dependency changes", () => {
      const patch = `
@@ -10,8 +10,8 @@
   "dependencies": {
-    "react": "^17.0.0",
-    "vue": "^2.6.0",
+    "react": "^18.0.0",
+    "vue": "^3.0.0",
     "lodash": "^4.17.21"
   }
`;
      const changes = parseDependencyChanges(patch);
      expect(changes).toHaveLength(2);
    });

    it("should return empty array for no changes", () => {
      const patch = `
@@ -10,7 +10,7 @@
   "name": "test-package",
-  "version": "1.0.0",
+  "version": "1.0.1",
`;
      const changes = parseDependencyChanges(patch);
      expect(changes).toHaveLength(0);
    });

    it("should handle undefined patch", () => {
      const changes = parseDependencyChanges(undefined);
      expect(changes).toHaveLength(0);
    });
  });
});
