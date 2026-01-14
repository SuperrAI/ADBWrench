import { BaseLLMProvider } from './base';
import { LLMProvider, LLMProviderConfig, ChatMessage } from '../types';

export class AnthropicProvider extends BaseLLMProvider {
  readonly providerId: LLMProvider = 'anthropic';
  protected readonly endpoint = 'https://api.anthropic.com/v1/messages';

  readonly config: LLMProviderConfig = {
    id: 'anthropic',
    name: 'Anthropic',
    apiKeyPlaceholder: 'sk-ant-...',
    models: [
      { id: 'claude-opus-4-5-20251124', name: 'Claude Opus 4.5' },
      { id: 'claude-sonnet-4-5-20250929', name: 'Claude Sonnet 4.5' },
      { id: 'claude-haiku-4-5-20251015', name: 'Claude Haiku 4.5' },
      { id: 'claude-opus-4-1-20250805', name: 'Claude Opus 4.1' },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
    ],
    defaultModel: 'claude-haiku-4-5-20251015',
  };

  protected getHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    };
  }

  protected buildRequestBody(
    messages: ChatMessage[],
    systemPrompt: string,
    model: string
  ): object {
    return {
      model,
      max_tokens: 4096,
      stream: true,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    };
  }

  protected parseStreamChunk(line: string): string | null {
    if (!line.startsWith('data: ')) return null;
    const data = line.slice(6);

    try {
      const json = JSON.parse(data);
      if (json.type === 'content_block_delta') {
        return json.delta?.text || null;
      }
      return null;
    } catch {
      return null;
    }
  }

  validateApiKey(key: string): boolean {
    return key.startsWith('sk-ant-') && key.length > 20;
  }
}
