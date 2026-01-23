/**
 * Compare two semantic versions
 *
 * @param v1 - First version string (can include prefixes like ^, ~, >=)
 * @param v2 - Second version string (can include prefixes like ^, ~, >=)
 * @returns -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 *
 * @example
 * compareVersions('1.0.0', '2.0.0') // returns -1
 * compareVersions('^2.5.0', '^2.5.0') // returns 0
 * compareVersions('3.0.0', '2.0.0') // returns 1
 */
export function compareVersions(v1: string, v2: string): number {
  const clean1 = cleanVersion(v1);
  const clean2 = cleanVersion(v2);

  const parts1 = clean1.split(".").map(Number);
  const parts2 = clean2.split(".").map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

/**
 * Check if version bump is a major version change
 *
 * @param oldVersion - Previous version string
 * @param newVersion - New version string
 * @returns true if major version increased, false otherwise
 *
 * @example
 * isMajorVersionBump('1.0.0', '2.0.0') // returns true
 * isMajorVersionBump('1.5.0', '1.6.0') // returns false
 */
export function isMajorVersionBump(
  oldVersion: string,
  newVersion: string,
): boolean {
  const oldMajor = getMajorVersion(oldVersion);
  const newMajor = getMajorVersion(newVersion);
  return newMajor > oldMajor;
}

/**
 * Clean version string by removing prefixes like ^, ~, >=, etc.
 */
function cleanVersion(version: string): string {
  return version.replace(/^[\^~>=<]+/, "");
}

/**
 * Extract major version number
 */
function getMajorVersion(version: string): number {
  const cleaned = cleanVersion(version);
  const major = cleaned.split(".")[0];
  return Number(major) || 0;
}
