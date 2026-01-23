import * as core from "@actions/core";
import * as github from "@actions/github";
import type { GitHubService } from "../services/github.js";
import {
  createSuggestionComment,
  createMockSuggestion,
} from "../services/suggestion.js";

const COMMAND_PATTERN = /^\/apply\s+([a-zA-Z0-9-_]+)$/;

/**
 * Parse /apply command from comment body
 *
 * @param body - Comment body text
 * @returns Codemod name if command is valid, null otherwise
 *
 * @example
 * parseCommand('/apply react-18-migration') // returns 'react-18-migration'
 * parseCommand('some other comment') // returns null
 */
export function parseCommand(body: string): string | null {
  const trimmed = body.trim();
  const match = trimmed.match(COMMAND_PATTERN);
  return match ? match[1] : null;
}

/**
 * Handle issue_comment events (for /apply commands)
 * Applies specific codemods when triggered via PR comments
 *
 * @param githubService - GitHub API service instance
 */
export async function handleIssueComment(
  githubService: GitHubService,
): Promise<void> {
  const { context } = github;
  const { payload } = context;

  // Type guard for issue_comment event
  if (!payload.comment || !payload.issue) {
    core.warning("No comment or issue found in payload");
    return;
  }

  // Only respond to comments on pull requests
  if (!payload.issue.pull_request) {
    core.info("Comment is not on a pull request, skipping");
    return;
  }

  const action = payload.action as string;
  if (action !== "created") {
    core.info(`Skipping action: ${action}`);
    return;
  }

  const commentBody = payload.comment.body as string;
  const codemodName = parseCommand(commentBody);

  if (!codemodName) {
    core.debug("No /apply command found in comment");
    return;
  }

  core.info(`Detected /apply command for codemod: ${codemodName}`);

  const { owner, repo } = context.repo;
  const pull_number = payload.issue.number;

  try {
    // Get PR details
    const pr = await githubService.getPullRequest(owner, repo, pull_number);

    // TODO: Fetch actual codemod from registry
    // For now, create a mock suggestion
    core.info(`Applying mock codemod: ${codemodName}`);

    const mockSuggestion = createMockSuggestion(
      "example-package",
      "1.0.0",
      "2.0.0",
    );

    await createSuggestionComment(
      githubService,
      {
        owner,
        repo,
        pull_number,
        commit_id: pr.head.sha,
      },
      mockSuggestion,
    );

    core.info(`Successfully applied codemod: ${codemodName}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    core.error(`Error applying codemod: ${message}`);
    throw error;
  }
}
