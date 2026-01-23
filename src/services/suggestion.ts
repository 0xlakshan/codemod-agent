import * as core from "@actions/core";
import type { GitHubService } from "./github.js";
import type { SuggestionParams, ReviewCommentParams } from "../types/index.js";

/**
 * Format code as a GitHub suggestion
 *
 * @param code - Code to be suggested
 * @returns Formatted suggestion in GitHub markdown format
 *
 * @example
 * formatSuggestion('const x = 1;') // returns '```suggestion\nconst x = 1;\n```'
 */
export function formatSuggestion(code: string): string {
  return `\`\`\`suggestion\n${code}\n\`\`\``;
}

/**
 * Create a suggestion comment on a pull request
 *
 * @param githubService - GitHub API service instance
 * @param baseParams - Base parameters for the review comment (owner, repo, pull_number, commit_id)
 * @param suggestion - Suggestion parameters including file path, line numbers, and code
 */
export async function createSuggestionComment(
  githubService: GitHubService,
  baseParams: Pick<
    ReviewCommentParams,
    "owner" | "repo" | "pull_number" | "commit_id"
  >,
  suggestion: SuggestionParams,
): Promise<void> {
  const suggestionBody = formatSuggestion(suggestion.suggestedCode);

  const commentParams: ReviewCommentParams = {
    ...baseParams,
    path: suggestion.filePath,
    body: suggestionBody,
  };

  // Single line suggestion
  if (suggestion.startLine === suggestion.endLine) {
    commentParams.line = suggestion.endLine;
  } else {
    // Multi-line suggestion
    commentParams.start_line = suggestion.startLine;
    commentParams.line = suggestion.endLine;
  }

  try {
    await githubService.createReviewComment(commentParams);
    core.info(
      `Suggestion created for ${suggestion.filePath}:${suggestion.startLine}-${suggestion.endLine}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    core.error(`Failed to create suggestion: ${message}`);
    throw error;
  }
}

/**
 * Create a mock suggestion for testing
 *
 * @param packageName - Name of the package
 * @param oldVersion - Old version string
 * @param newVersion - New version string
 * @returns Mock suggestion parameters
 */
export function createMockSuggestion(
  packageName: string,
  oldVersion: string,
  newVersion: string,
): SuggestionParams {
  return {
    filePath: "package.json",
    startLine: 10,
    endLine: 10,
    originalCode: `    "${packageName}": "${oldVersion}"`,
    suggestedCode: `    "${packageName}": "${newVersion}" // Codemod applied`,
  };
}
