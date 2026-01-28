import dotenv from "dotenv";
import fs from "fs";

import express, { NextFunction, Request } from "express";
import cors from "cors";
import consoleLogLevel from "console-log-level";

import { App } from "octokit";
import SmeeClient from "smee-client";
import { createNodeMiddleware } from "@octokit/webhooks";

dotenv.config();

const expressApp = express();

expressApp.use(cors());

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

    app.webhooks.on("pull_request.opened", async ({ octokit, payload }) => {
      console.log(`pull request - #${payload.pull_request.number}`);

      const listFiles = await octokit.rest.pulls.listFiles({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        pull_number: payload.pull_request.number,
      });

      console.log("listFiles.data ---> ", listFiles.data);

      for (const eachFile of listFiles.data) {
        // Only updated code gets diff checked
        if (!["added", "modified", "changed"].includes(eachFile.status)) {
          continue;
        }

        if (eachFile.status === "added") {
          const fileHeadContent = await octokit.rest.repos.getContent({
            owner: payload.repository.owner.login,
            repo: payload.repository.name,
            path: eachFile.filename,
            ref: payload.pull_request.head.sha,
            mediaType: { format: "diff" },
          });

          // Narrow down to correct TS return type
          if (Array.isArray(fileHeadContent.data)) {
            throw new Error("Unsupported data type");
          }

          if (fileHeadContent.data.type !== "file") {
            throw new Error("Unsupported fileConent type");
          }

          const decodedHeadContent = Buffer.from(
            fileHeadContent.data.content,
            "base64",
          ).toString("utf-8");

          console.log("Decoded new file head content:\n", decodedHeadContent);

          // TODO: Just apply codemods to the head
          continue;
        }

        const fileHeadContent = await octokit.rest.repos.getContent({
          owner: payload.repository.owner.login,
          repo: payload.repository.name,
          path: eachFile.filename,
          ref: payload.pull_request.head.sha,
          mediaType: { format: "diff" },
        });

        const fileBaseContent = await octokit.rest.repos.getContent({
          owner: payload.repository.owner.login,
          repo: payload.repository.name,
          path: eachFile.filename,
          ref: payload.pull_request.base.sha,
          mediaType: { format: "diff" },
        });

        console.log("whole fileContent --> ", fileHeadContent);

        // Narrow down to correct TS return type
        if (
          Array.isArray(fileHeadContent.data) ||
          Array.isArray(fileBaseContent.data)
        ) {
          throw new Error("Unsupported data type");
        }

        if (
          fileHeadContent.data.type !== "file" ||
          fileBaseContent.data.type !== "file"
        ) {
          throw new Error("Unsupported fileConent type");
        }

        // TODO: Check the diff
        // Apply the codemods to only where code has been changed & added
        // No need to do diff checks on new files and deleted files
        const decodedHeadContent = Buffer.from(
          fileHeadContent.data.content,
          "base64",
        ).toString("utf-8");
        const decodedBaseContent = Buffer.from(
          fileBaseContent.data.content,
          "base64",
        ).toString("utf-8");

        console.log("Decoded updated file base content:\n", decodedBaseContent);
        console.log("Decoded updated file head content:\n", decodedHeadContent);
      }
    });

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
