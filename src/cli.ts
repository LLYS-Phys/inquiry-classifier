import { createClassifier, type AiProvider } from './config.js';

/**
 * Употреба:
 *   npm run classify -- "Видеоурокът не се зарежда"
 *   npm run classify -- --ai=mock "Искам да получа фактура"
 *   echo "текст" | npm run classify
 */
async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

const args = process.argv.slice(2);
const aiFlag = args.find((a) => a.startsWith('--ai='))?.slice('--ai='.length) as
  | AiProvider
  | undefined;
const textArgs = args.filter((a) => !a.startsWith('--ai='));

const input = textArgs.length > 0 ? textArgs.join(' ') : process.stdin.isTTY ? '' : await readStdin();

const classifier = createClassifier(process.env, aiFlag);
const outcome = await classifier.classify(input);

if (outcome.ok) {
  console.log(JSON.stringify(outcome.result, null, 2));
} else {
  console.log(JSON.stringify({ error: outcome.error }, null, 2));
  process.exitCode = 1;
}
