import * as core from "@actions/core";
import * as github from "@actions/github";
import { GitHubService } from "./github";
import { handlePullRequest } from "./handlers/pull-request";
import { handleIssueComment } from "./handlers/issue-comment";
import { Octokit, App } from "octokit";
import { createNodeMiddleware } from "@octokit/webhooks";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

async function run(): Promise<void> {
  try {
    const appId = process.env.APP_ID;
    const privateKeyPath = process.env.PRIVATE_KEY_PATH;
    const secret = process.env.WEBHOOK_SECRET;
    const enterpriseHostname = process.env.ENTERPRISE_HOSTNAME;

    if (!appId || !privateKeyPath || !secret || !enterpriseHostname) {
      throw new Error("Missing required environment variables");
    }

    const privateKey = fs.readFileSync(privateKeyPath as string, "utf8");
    const app = new App({
      appId,
      privateKey,
      webhooks: {
        secret,
      },
      ...(enterpriseHostname && {
        Octokit: Octokit.defaults({
          baseUrl: `https://${enterpriseHostname}/api/v3`,
        }),
      }),
    });

    // const messageForNewPRs = fs.readFileSync("./message.md", "utf8");

    // const token = core.getInput("github-token", { required: true });
    // if (!token) {
    //   throw new Error("GitHub token is required");
    // }
    //https://github.com/github/github-app-js-sample/blob/main/app.js
    // const octokit = github.getOctokit(token);
    // const githubService = new GitHubService(octokit);
    //
    // const eventName = github.context.eventName;
    // core.info(`Event: ${eventName}`);
    //
    // switch (eventName) {
    //   case "pull_request":
    //     await handlePullRequest(githubService);
    //     break;
    //
    //   case "issue_comment":
    //     await handleIssueComment(githubService);
    //     break;
    //
    //   default:
    //     core.warning(`Unsupported event: ${eventName}`);
    //     break;
    // }
    //
    // core.info("Action completed successfully");
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("An unknown error occurred");
    }
  }
}

run();
