import dotenv from "dotenv";
import fs from "fs";

import express, { NextFunction, Request } from "express";
import cors from "cors";
import consoleLogLevel from "console-log-level";

import type { Octokit } from "octokit";
import { App } from "octokit";
import SmeeClient from "smee-client";
import { createNodeMiddleware, EmitterWebhookEvent } from "@octokit/webhooks";
import { GitHubPRClient } from "./github.js";
import { applyCodemod } from "./applyCodemod.js";

dotenv.config();

const expressApp = express();

expressApp.use(cors());

// Types
export type AppOctokit = Octokit;

export type PullRequestOpenedPayload =
  EmitterWebhookEvent<"pull_request.opened">["payload"];

export type CommentPayload = EmitterWebhookEvent<"issue_comment">["payload"];

export type FileType = {
  sha: string | null;
  filename: string;
  status:
    | "added"
    | "removed"
    | "renamed"
    | "changed"
    | "modified"
    | "copied"
    | "unchanged";
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string | undefined;
  previous_filename?: string | undefined;
};

async function run(): Promise<void> {
  const appId = process.env.APP_ID;
  const privateKeyPath = process.env.PRIVATE_KEY_PATH;
  const secret = process.env.WEBHOOK_SECRET;

  if (!appId || !privateKeyPath || !secret) {
    throw new Error("Missing required environment variables");
  }

  const privateKey = fs.readFileSync(privateKeyPath, "utf8");

  const app = new App({
    appId,
    privateKey,
    webhooks: {
      secret,
    },
    log: consoleLogLevel({ level: "info" }),
  });

  try {
    const data = await app.octokit.request("/app");

    app.octokit.log.debug(`Authenticated as '${data.data.name}'`);
    console.log(`authenticated as ${data.data.name}`);

    app.webhooks.onAny(({ id, name, payload }) => {
      console.log(name, id, payload.sender?.login, " event received");
    });

    app.webhooks.on(
      "issue_comment",
      async ({ octokit, payload: commentPayload }) => {
        if (!commentPayload.issue.pull_request) {
          return;
        }

        if (!commentPayload.comment.body) {
          return;
        }

        const commentBody = commentPayload.comment.body.split(" ");

        if (commentBody.length !== 2 || commentBody[0] !== "/codemod") {
          return;
        }

        const codemodCommand = commentBody[1];
        const githubContext = await GitHubPRClient.create(
          octokit,
          commentPayload,
        );
        const changedFiles = await githubContext.getChangedFiles();

        let codemodAppliedFiles: FileType[] = [];

        for (const file of changedFiles) {
          const fileTextContent = await githubContext.getFileTextContent(
            file,
            "head",
          );

          app.octokit.log.info(`🟢 Processing: ${file.filename} \n`);

          try {
            const updatedContent = await applyCodemod(
              fileTextContent,
              codemodCommand,
            );

            if (updatedContent.diff.hasChanges) {
              await githubContext.createCommitWithChanges(
                file,
                updatedContent.after,
              );
              codemodAppliedFiles.push(file);
              app.octokit.log.info(`💚 Codemod applied to ${file.filename}`);
            }

            app.octokit.log.info("\n\n\n\n");
          } catch (error) {
            if (error instanceof Error && "response" in error) {
              const apiError = error as any;
              console.error(
                `Failed to apply codemod to ${file.filename}:`,
                apiError.response?.data?.errors || apiError.message,
              );
            } else {
              console.error(
                `Failed to apply codemod to ${file.filename}:`,
                error,
              );
            }
          }
        }

        await githubContext.summeryComment(codemodAppliedFiles);
      },
    );

    // TODO: On PR Opened event
    // app.webhooks.on("pull_request.opened", async ({ octokit, payload }) => {
    //   console.log(`pull request - #${payload.pull_request.number}`);
    // });

    app.webhooks.onError((error) => {
      throw new Error(`web hook error: ${error.event}`);
    });

    expressApp.use((req: Request, _, next: NextFunction) => {
      console.log(`${req.method} ${req.path}`);
      next();
    });

    expressApp.use(createNodeMiddleware(app.webhooks, { path: "/" }));
    const port = process.env.PORT || 5000;

    expressApp.listen(port, () => {
      app.octokit.log.info(`Server listening on port ${port}`);
      console.log(`Server listening on port ${port}`);
    });

    if (process.env.NODE_ENV === "development") {
      const smeeUrl = "https://smee.io/RwPIM6pK5kexx2GF";
      const smee = new SmeeClient({
        source: smeeUrl,
        target: `http://localhost:${port}`,
        logger: console,
      });
      await smee.start();
      console.log(`Smee client forwarding from ${smeeUrl}`);
    }
  } catch (error) {
    console.log("error --> ", error);
    if (error instanceof Error) {
      app.octokit.log.error(error.message);
    } else {
      app.octokit.log.error("An unknown error occurred");
    }
  }
}

run();
