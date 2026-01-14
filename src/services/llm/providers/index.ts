import { LLMProvider, LLMProviderAdapter, LLMProviderConfig } from '../types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';
import { OpenRouterProvider } from './openrouter';

const providers: Record<LLMProvider, LLMProviderAdapter> = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
  gemini: new GeminiProvider(),
  openrouter: new OpenRouterProvider(),
};

export function getProvider(providerId: LLMProvider): LLMProviderAdapter {
  const provider = providers[providerId];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  return provider;
}

export function getAllProviders(): LLMProviderAdapter[] {
  return Object.values(providers);
}

export function getProviderConfigs(): LLMProviderConfig[] {
  return Object.values(providers).map((p) => p.config);
}

export function getAvailableProviderIds(): LLMProvider[] {
  return Object.keys(providers) as LLMProvider[];
}
