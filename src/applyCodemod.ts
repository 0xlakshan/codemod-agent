import { spawn } from "child_process";
import { mkdirSync, writeFileSync, readFileSync, rmSync } from "fs";
import { randomBytes } from "crypto";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const diffPath = join(__dirname, "..", "diff.node"); // load diff.node from project root
const { computeDiff } = require(diffPath);

export function applyCodemod(
  fileContent: string,
  codemodCommand: string,
): Promise<{
  before: string;
  after: string;
  diff: { diff: string; hasChanges: boolean };
}> {
  return new Promise((resolve, reject) => {
    const id = randomBytes(8).toString("hex");
    const tempDir = `.temp-${id}`;
    const tempFile = `${tempDir}/temp.ts`;

    try {
      mkdirSync(tempDir, { recursive: true });
      writeFileSync(tempFile, fileContent);
    } catch (error) {
      return reject(new Error(`Failed to create temp files ${error}`));
    }

    const child = spawn(
      "npx",
      [
        "codemod@latest",
        "run",
        codemodCommand,
        "--allow-dirty",
        "--no-interactive",
      ],
      {
        cwd: tempDir,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      try {
        const result = readFileSync(tempFile, "utf8");
        rmSync(tempDir, { recursive: true, force: true });

        if (result === fileContent) {
          return reject(
            new Error(`Codemod failed (exit ${code}) ${stderr || stdout}`),
          );
        }

        const diffResult = computeDiff(fileContent, result);

        resolve({
          before: fileContent,
          after: result,
          diff: diffResult,
        });
      } catch (error) {
        rmSync(tempDir, { recursive: true, force: true });
        reject(new Error(`Failed to read result ${error}`));
      }
    });

    child.on("error", (error) => {
      rmSync(tempDir, { recursive: true, force: true });
      reject(new Error(`Failed to spawn codemod ${error}`));
    });
  });
}
