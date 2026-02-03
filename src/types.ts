import type { Octokit } from "octokit";
import { EmitterWebhookEvent } from "@octokit/webhooks";

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
