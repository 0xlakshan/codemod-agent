import * as core from "@actions/core";
import * as github from "@actions/github";
import { GitHubService } from "./github";
import { handlePullRequest } from "./handlers/pull-request";
import { handleIssueComment } from "./handlers/issue-comment";
import dotenv from "dotenv";
dotenv.config();

async function run(): Promise<void> {
  try {
    const token = core.getInput("github-token", { required: true });
    if (!token) {
      throw new Error("GitHub token is required");
    }

    const octokit = github.getOctokit(token);
    const githubService = new GitHubService(octokit);

    const eventName = github.context.eventName;
    core.info(`Event: ${eventName}`);

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
