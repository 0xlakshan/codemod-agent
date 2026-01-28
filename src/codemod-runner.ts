import { diffLines } from "diff";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

interface DiffResult {
  hasChanges: boolean;
  changedLines: string[];
  addedLines: string[];
}

export function analyzeDiff(
  baseContent: string,
  headContent: string,
): DiffResult {
  const diff = diffLines(baseContent, headContent);

  const changedLines: string[] = [];
  const addedLines: string[] = [];

  for (const part of diff) {
    if (part.added) {
      addedLines.push(...part.value.split("\n").filter((line) => line.trim()));
    } else if (part.removed) {
      changedLines.push(
        ...part.value.split("\n").filter((line) => line.trim()),
      );
    }
  }

  return {
    hasChanges: diff.some((part) => part.added || part.removed),
    changedLines,
    addedLines,
  };
}

export function createDiffString(
  originalContent: string,
  modifiedContent: string,
): string {
  const diff = diffLines(originalContent, modifiedContent);
  let diffString = "";

  for (const part of diff) {
    const lines = part.value.split("\n").filter((line) => line !== "");
    for (const line of lines) {
      if (part.added) {
        diffString += `+ ${line}\n`;
      } else if (part.removed) {
        diffString += `- ${line}\n`;
      } else {
        diffString += `  ${line}\n`;
      }
    }
  }

  return diffString;
}

export async function applyCodemodToContent(
  content: string,
  filename: string,
  codemodName: string = "@nodejs/chalk-to-util-styletext",
): Promise<string> {
  const tempDir = path.join(process.cwd(), ".temp-codemod");
  const tempFile = path.join(tempDir, filename);

  try {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    fs.writeFileSync(tempFile, content);

    execSync(`npx codemod@latest ${codemodName} --allow-dirty`, {
      cwd: tempDir,
      stdio: "pipe",
    });

    const modifiedContent = fs.readFileSync(tempFile, "utf-8");
    return modifiedContent;
  } catch (error) {
    console.error("Codemod execution failed:", error);
    return content;
  } finally {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    if (fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  }
}
