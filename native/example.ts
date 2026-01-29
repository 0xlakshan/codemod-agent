import { generateDiff } from './native';

async function example() {
  const original = 'line1\nline2\nline3\n';
  const modified = 'line1\nmodified\nline3\n';

  const diff = await generateDiff('example.txt', original, modified, {
    contextLines: 3,
    maxLinesPerFile: 500,
  });

  console.log(diff.diffText);
  console.log(`+${diff.additions} -${diff.deletions}`);
}

example().catch(console.error);
