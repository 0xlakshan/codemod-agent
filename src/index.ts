import * as core from "@actions/core";
import * as github from "@actions/github";
import { GitHubService } from "./services/github.js";
import { handlePullRequest } from "./handlers/pull-request.js";
import { handleIssueComment } from "./handlers/issue-comment.js";

/**
 * Main entry point for the GitHub Action
 * Routes events to appropriate handlers based on event type
 */
async function run(): Promise<void> {
  try {
    // Validate and get GitHub token
    const token = core.getInput("github-token", { required: true });
    if (!token) {
      throw new Error("GitHub token is required");
    }

    // Initialize Octokit and GitHub service
    const octokit = github.getOctokit(token);
    const githubService = new GitHubService(octokit);

    const eventName = github.context.eventName;
    core.info(`Event: ${eventName}`);

    // Route to appropriate handler based on event type
    switch (eventName) {
      case "pull_request":
        await handlePullRequest(githubService);
        break;

      case "issue_comment":
        await handleIssueComment(githubService);
        break;

      default:
        core.warning(`Unsupported event: ${eventName}`);
        break;
    }

    core.info("Action completed successfully");
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("An unknown error occurred");
    }
  }
}

run();
