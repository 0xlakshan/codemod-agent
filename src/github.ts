import type { AppOctokit, PullRequestOpenedPayload } from "./index";

type FileType = {
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

export class GitHubPRClient {
  private readonly octokit: AppOctokit;
  private readonly payload: PullRequestOpenedPayload;

  constructor(octokit: AppOctokit, payload: PullRequestOpenedPayload) {
    this.octokit = octokit;
    this.payload = payload;
  }

  // add the return type or error
  private async listFiles() {
    const listFiles = await this.octokit.rest.pulls.listFiles({
      owner: this.payload.repository.owner.login,
      repo: this.payload.repository.name,
      pull_number: this.payload.pull_request.number,
    });
    return listFiles;
  }

  public async getFileTextContent(
    { filename }: FileType,
    refType: "head" | "base",
  ) {
    const fileContent = await this.octokit.rest.repos.getContent({
      owner: this.payload.repository.owner.login,
      repo: this.payload.repository.name,
      path: filename,
      ref:
        refType === "head"
          ? this.payload.pull_request.head.sha
          : this.payload.pull_request.base.sha,
      mediaType: { format: "diff" },
    });

    // Narrow down to correct TS return type
    if (Array.isArray(fileContent.data)) {
      throw new Error("Unsupported data type");
    }
    if (fileContent.data.type !== "file") {
      throw new Error("Unsupported fileContent type");
    }

    const decodedHeadContent = Buffer.from(
      fileContent.data.content,
      "base64",
    ).toString("utf-8");

    return decodedHeadContent;
  }

  public async getChangedFiles() {
    const files = await this.listFiles();

    const changedFiles = files.data.filter((file) => {
      const hasChanges = file.additions !== 0 || file.deletions !== 0;
      const isRelevantStatus = ["added", "modified", "changed"].includes(
        file.status,
      );
      return hasChanges && isRelevantStatus;
    });

    return changedFiles;
  }
}
