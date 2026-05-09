import { RuleBasedMockAiProvider } from "./rule-provider";
import type { AiInsightProvider } from "./types";

const provider: AiInsightProvider = new RuleBasedMockAiProvider();

export function getAiProvider() {
  return provider;
}

export * from "./types";

