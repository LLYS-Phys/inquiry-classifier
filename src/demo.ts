import { createClassifier, type AiProvider } from './config.js';

/**
 * Демо: примерите от заданието + гранични случаи.
 *   npm run demo                     → само правила
 *   npm run demo -- --ai=mock        → правила + примерна AI услуга
 *   npm run demo -- --ai=mock --ai-down   → симулира недостъпна AI услуга
 */
const args = process.argv.slice(2);
const provider = (args.find((a) => a.startsWith('--ai='))?.slice(5) ?? 'none') as AiProvider;
const aiDown = args.includes('--ai-down');

const classifier = createClassifier(
  { ...process.env, MOCK_AI_FAIL: aiDown ? 'true' : 'false' },
  provider,
);

const samples: unknown[] = [
  'Не мога да вляза в профила си, въпреки че паролата е правилна.',
  'Видеоурокът по математика не се зарежда.',
  'Къде мога да намеря упражненията за 5. клас?',
  'Как мога да променя имейла на профила си?',
  'Искам да получа фактура за последното плащане.',
  'Здравейте, имам един въпрос.', // двусмислено → AI / преглед
  '',
  '   ',
  '?!?!',
  null,
  42,
  'а'.repeat(2500),
];

console.log(`AI_PROVIDER=${provider}${aiDown ? ' (симулирана авария)' : ''}\n`);

for (const sample of samples) {
  const shown = typeof sample === 'string' ? JSON.stringify(sample.slice(0, 70)) : String(sample);
  const outcome = await classifier.classify(sample);
  console.log(`▶ ${shown}`);
  console.log(JSON.stringify(outcome.ok ? outcome.result : { error: outcome.error }, null, 2));
  console.log();
}
