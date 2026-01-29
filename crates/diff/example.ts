import { generateDiff } from './index.js';

async function example() {
  const original = 'line1\nline2\nline3\n';
  const modified = 'line1\nmodified\nline3\n';

  const diff = await generateDiff('example.txt', original, modified, {
    contextLines: 3,
    color: true,
    maxLinesPerFile: 500,
  });

  console.log('============================================================');
  console.log(`File: ${diff.path}`);
  console.log('============================================================');
  console.log(diff.diffText);
  console.log(`+${diff.additions} additions, -${diff.deletions} deletions`);
}

example().catch(console.error);
