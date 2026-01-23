import * as core from "@actions/core";
import * as github from "@actions/github";
import type { GitHubService } from "../services/github.js";
import {
  extractPackageJsonChanges,
  parseDependencyChanges,
} from "../services/diff-parser.js";
import { isMajorVersionBump } from "../utils/version.js";

/**
 * Handle pull_request events
 * Detects dependency version bumps in package.json and suggests codemods
 *
 * @param githubService - GitHub API service instance
 */
export async function handlePullRequest(
  githubService: GitHubService,
): Promise<void> {
  const { context } = github;
  const { payload } = context;

  // Type guard for pull_request event
  if (!payload.pull_request) {
    core.warning("No pull request found in payload");
    return;
  }

  const action = payload.action as string;
  if (!["opened", "synchronize", "reopened"].includes(action)) {
    core.info(`Skipping action: ${action}`);
    return;
  }

  const { owner, repo } = context.repo;
  const pull_number = payload.pull_request.number;

  core.info(`Processing PR #${pull_number} (action: ${action})`);

  try {
    // Get PR details
    const pr = await githubService.getPullRequest(owner, repo, pull_number);

    // Compare commits to get file changes
    const comparison = await githubService.compareCommits(
      owner,
      repo,
      pr.base.sha,
      pr.head.sha,
    );

    // Check for package.json changes
    const packageJsonFile = extractPackageJsonChanges(comparison.files);

    if (!packageJsonFile) {
      core.info("No package.json changes detected");
      return;
    }

    core.info("package.json changes detected");

    // Parse dependency changes
    const dependencyChanges = parseDependencyChanges(packageJsonFile.patch);

    if (dependencyChanges.length === 0) {
      core.info("No dependency version changes found");
      return;
    }

    core.info(`Found ${dependencyChanges.length} dependency change(s):`);

    for (const change of dependencyChanges) {
      const isMajor = isMajorVersionBump(change.oldVersion, change.newVersion);
      core.info(
        `  - ${change.name}: ${change.oldVersion} → ${change.newVersion} (${change.type})${isMajor ? " [MAJOR]" : ""}`,
      );
    }

    // TODO: Check registry for codemods and create suggestions
    core.info("Codemod registry check not yet implemented");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    core.error(`Error processing pull request: ${message}`);
    throw error;
  }
}
