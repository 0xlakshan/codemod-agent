import * as core from "@actions/core";
import type { FileChange, DependencyChange } from "../types/index.js";
import { compareVersions } from "../utils/version.js";

/**
 * Extract package.json changes from file list
 *
 * @param files - Array of changed files from GitHub API
 * @returns FileChange object for package.json if found, null otherwise
 */
export function extractPackageJsonChanges(
  files: FileChange[] | undefined,
): FileChange | null {
  if (!files) {
    return null;
  }

  const packageJsonFile = files.find(
    (file) =>
      file.filename === "package.json" &&
      (file.status === "modified" || file.status === "added"),
  );

  return packageJsonFile || null;
}

/**
 * Parse dependency changes from package.json diff
 *
 * @param patch - Git diff patch content
 * @returns Array of dependency changes with old and new versions
 *
 * @example
 * const patch = `
 * -    "react": "^17.0.0",
 * +    "react": "^18.0.0",
 * `;
 * parseDependencyChanges(patch) // returns [{ name: 'react', oldVersion: '^17.0.0', newVersion: '^18.0.0', type: 'dependencies' }]
 */
export function parseDependencyChanges(
  patch: string | undefined,
): DependencyChange[] {
  if (!patch) {
    core.debug("No patch content found");
    return [];
  }

  const changes: DependencyChange[] = [];
  const lines = patch.split("\n");

  let currentSection: DependencyChange["type"] | null = null;
  const addedDeps = new Map<string, string>();
  const removedDeps = new Map<string, string>();

  for (const line of lines) {
    // Detect dependency section
    if (line.includes('"dependencies"')) {
      currentSection = "dependencies";
    } else if (line.includes('"devDependencies"')) {
      currentSection = "devDependencies";
    } else if (line.includes('"peerDependencies"')) {
      currentSection = "peerDependencies";
    } else if (line.includes('"optionalDependencies"')) {
      currentSection = "optionalDependencies";
    }

    if (!currentSection) continue;

    // Parse added dependencies
    const addMatch = line.match(/^\+\s*"([^"]+)":\s*"([^"]+)"/);
    if (addMatch) {
      const [, name, version] = addMatch;
      addedDeps.set(name, version);
    }

    // Parse removed dependencies
    const removeMatch = line.match(/^-\s*"([^"]+)":\s*"([^"]+)"/);
    if (removeMatch) {
      const [, name, version] = removeMatch;
      removedDeps.set(name, version);
    }
  }

  // Find version bumps (dependencies that were both removed and added)
  for (const [name, newVersion] of addedDeps) {
    const oldVersion = removedDeps.get(name);
    if (oldVersion && compareVersions(oldVersion, newVersion) !== 0) {
      changes.push({
        name,
        oldVersion,
        newVersion,
        type: currentSection || "dependencies",
      });
    }
  }

  return changes;
}
