import dotenv from "dotenv";
import fs from "fs";

import express /*, { NextFunction, Request, Response }*/ from "express";
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
      console.log(name, id, payload, " event received");
    });

    app.webhooks.on("pull_request.opened", async ({ octokit, payload }) => {
      console.log(
        `Received a pull request event for #${payload.pull_request.number}`,
      );
      console.log("pull request payload", payload);
      await octokit.rest.issues.createComment({
        owner: payload.repository.owner.login,
        repo: payload.repository.name,
        issue_number: payload.pull_request.number,
        body: "Hello world :)",
      });
    });

    app.webhooks.onError((error) => {
      throw new Error(`web hook error: ${error.event}`);
    });

    expressApp.use((req, _, next) => {
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
