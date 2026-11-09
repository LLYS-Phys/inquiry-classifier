import { AnthropicClassifier } from './ai/anthropic.js';
import { MockAiClassifier } from './ai/mock.js';
import type { AiClassifier } from './ai/types.js';
import { InquiryClassifier } from './classifier.js';

export type AiProvider = 'none' | 'mock' | 'anthropic';

export function createAiClassifier(
  env: NodeJS.ProcessEnv = process.env,
  providerOverride?: AiProvider,
): AiClassifier | undefined {
  const provider = providerOverride ?? ((env.AI_PROVIDER ?? 'none') as AiProvider);

  switch (provider) {
    case 'none':
      return undefined;
    case 'mock':
      return new MockAiClassifier({ fail: env.MOCK_AI_FAIL === 'true' });
    case 'anthropic': {
      if (!env.ANTHROPIC_API_KEY) {
        throw new Error('AI_PROVIDER=anthropic изисква ANTHROPIC_API_KEY.');
      }
      return new AnthropicClassifier({
        apiKey: env.ANTHROPIC_API_KEY,
        model: env.ANTHROPIC_MODEL,
        timeoutMs: env.AI_TIMEOUT_MS ? Number(env.AI_TIMEOUT_MS) : undefined,
      });
    }
    default:
      throw new Error(`Непознат AI_PROVIDER: ${String(provider)} (none | mock | anthropic)`);
  }
}

export function createClassifier(
  env: NodeJS.ProcessEnv = process.env,
  providerOverride?: AiProvider,
): InquiryClassifier {
  return new InquiryClassifier({ ai: createAiClassifier(env, providerOverride) });
}
