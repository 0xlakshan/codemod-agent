import * as core from "@actions/core";
import type {
  PullRequest,
  CompareCommits,
  ReviewCommentParams,
} from "../types/index.js";

export class GitHubService {
  constructor(
    private octokit: ReturnType<typeof import("@actions/github").getOctokit>,
  ) {}

  /**
   * Get pull request details
   */
  async getPullRequest(
    owner: string,
    repo: string,
    pull_number: number,
  ): Promise<PullRequest> {
    try {
      core.debug(`Fetching PR #${pull_number} from ${owner}/${repo}`);
      const { data } = await this.octokit.request(
        "GET /repos/{owner}/{repo}/pulls/{pull_number}",
        {
          owner,
          repo,
          pull_number,
        },
      );
      return data as PullRequest;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      core.error(`Failed to fetch PR: ${message}`);
      throw new Error(`Failed to fetch pull request: ${message}`);
    }
  }

  /**
   * Compare two commits and get file changes
   */
  async compareCommits(
    owner: string,
    repo: string,
    base: string,
    head: string,
  ): Promise<CompareCommits> {
    try {
      core.debug(`Comparing ${base}...${head} in ${owner}/${repo}`);
      const { data } = await this.octokit.request(
        "GET /repos/{owner}/{repo}/compare/{basehead}",
        {
          owner,
          repo,
          basehead: `${base}...${head}`,
        },
      );
      return data as CompareCommits;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      core.error(`Failed to compare commits: ${message}`);
      throw new Error(`Failed to compare commits: ${message}`);
    }
  }

  /**
   * Create a review comment on a pull request
   */
  async createReviewComment(params: ReviewCommentParams): Promise<void> {
    try {
      core.debug(
        `Creating review comment on ${params.path}:${params.line || params.start_line}`,
      );
      await this.octokit.request(
        "POST /repos/{owner}/{repo}/pulls/{pull_number}/comments",
        {
          owner: params.owner,
          repo: params.repo,
          pull_number: params.pull_number,
          commit_id: params.commit_id,
          path: params.path,
          body: params.body,
          line: params.line,
          start_line: params.start_line,
          start_side: params.start_side,
          side: params.side || "RIGHT",
        },
      );
      core.info(`Review comment created on ${params.path}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      core.error(`Failed to create review comment: ${message}`);
      throw new Error(`Failed to create review comment: ${message}`);
    }
  }
}
