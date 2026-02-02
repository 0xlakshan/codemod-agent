import type { AppOctokit, CommentPayload } from "./index.js";

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
  private readonly owner: string;
  private readonly repository: string;
  private readonly pullRequestNumber: number;
  private pullRequest?: Awaited<
    ReturnType<AppOctokit["rest"]["pulls"]["get"]>
  >["data"];

  constructor(octokit: AppOctokit, commentPayload: CommentPayload) {
    this.octokit = octokit;
    this.owner = commentPayload.repository.owner.login;
    this.repository = commentPayload.repository.name;
    this.pullRequestNumber = commentPayload.issue.number;
  }

  static async create(octokit: AppOctokit, commentPayload: CommentPayload) {
    const client = new GitHubPRClient(octokit, commentPayload);
    const pullRequestResponse = await octokit.rest.pulls.get({
      owner: client.owner,
      repo: client.repository,
      pull_number: client.pullRequestNumber,
    });
    client.pullRequest = pullRequestResponse.data;
    return client;
  }

  // Add the return type or error
  private async listFiles() {
    const listFiles = await this.octokit.rest.pulls.listFiles({
      owner: this.owner,
      repo: this.repository,
      pull_number: this.pullRequestNumber,
    });
    return listFiles;
  }

  get head() {
    return this.pullRequest!.head;
  }

  get base() {
    return this.pullRequest!.base;
  }

  public async getFileTextContent(
    { filename }: FileType,
    refType: "head" | "base",
  ) {
    const fileContent = await this.octokit.rest.repos.getContent({
      owner: this.owner,
      repo: this.repository,
      path: filename,
      ref: refType === "head" ? this.head.sha : this.base.sha,
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

  public async createCommitWithChanges(file: FileType, newFileContent: string) {
    const base64Content = Buffer.from(newFileContent, "utf-8").toString(
      "base64",
    );

    const result = await this.octokit.rest.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repository,
      path: file.filename,
      message: `💚 Add Codemod to ${file.filename}`,
      content: base64Content,
      sha: file.sha || undefined,
      branch: this.head.ref,
    });

    return result;
  }

  public async summeryComment(fileList: FileType[]) {
    // TODO: if no files been changed let the user know
    // If only one file been changed change the setence accordingly
    await this.octokit.rest.issues.createComment({
      owner: this.owner,
      repo: this.repository,
      issue_number: this.pullRequestNumber,
      body: `💚 Codemods have been applied to the following files \n${fileList.map((file) => `- ${file.filename}`).join('\n')}`,
    });
  }
}
