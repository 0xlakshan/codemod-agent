import { applyCodemod } from "./applyCodemod.js";

const fileTextContent =
  'import chalk from "chalk";\n\nexport const CONFIG = {\n  appName: "TaskApp",\n  version: "1.0.0",\n  maxUsers: 100,\n};\n\nexport function printConfig(): void {\n  console.log(chalk.blue("Application Configuration:"));\n  console.log(chalk.green(`Name: ${CONFIG.appName}`));\n  console.log(chalk.green(`Version: ${CONFIG.version}`));\n  console.log(chalk.green(`Max Users: ${CONFIG.maxUsers}`));\n}';

const codemodCommand = "@nodejs/chalk-to-util-styletext";

console.log("before codemod", fileTextContent);

try {
  const result = await applyCodemod(fileTextContent, codemodCommand);

  console.log("\nCodemod applied successfully\n");
  console.log("after codemod --> \n", result.after);
  console.log("\nHas changes:", result.diff.hasChanges);
} catch (error) {
  console.error("Codemod Failed:", error);
  process.exit(1);
}
