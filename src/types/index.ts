import type { Endpoints } from "@octokit/types";

export type PullRequest =
  Endpoints["GET /repos/{owner}/{repo}/pulls/{pull_number}"]["response"]["data"];
export type CompareCommits =
  Endpoints["GET /repos/{owner}/{repo}/compare/{basehead}"]["response"]["data"];
export type FileChange = NonNullable<CompareCommits["files"]>[number];

export interface DependencyChange {
  name: string;
  oldVersion: string;
  newVersion: string;
  type:
    | "dependencies"
    | "devDependencies"
    | "peerDependencies"
    | "optionalDependencies";
}

export interface ReviewCommentParams {
  owner: string;
  repo: string;
  pull_number: number;
  commit_id: string;
  path: string;
  body: string;
  line?: number;
  start_line?: number;
  start_side?: "LEFT" | "RIGHT";
  side?: "LEFT" | "RIGHT";
}

export interface SuggestionParams {
  filePath: string;
  startLine: number;
  endLine: number;
  originalCode: string;
  suggestedCode: string;
}
