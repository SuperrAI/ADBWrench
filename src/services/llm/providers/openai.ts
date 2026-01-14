import { BaseLLMProvider } from './base';
import { LLMProvider, LLMProviderConfig, ChatMessage } from '../types';

export class OpenAIProvider extends BaseLLMProvider {
  readonly providerId: LLMProvider = 'openai';
  protected readonly endpoint = 'https://api.openai.com/v1/chat/completions';

  readonly config: LLMProviderConfig = {
    id: 'openai',
    name: 'OpenAI',
    apiKeyPlaceholder: 'sk-...',
    models: [
      { id: 'gpt-5', name: 'GPT-5' },
      { id: 'o3', name: 'o3' },
      { id: 'o4-mini', name: 'o4-mini' },
      { id: 'gpt-4.1', name: 'GPT-4.1' },
      { id: 'gpt-4o', name: 'GPT-4o' },
    ],
    defaultModel: 'gpt-4o',
  };

  protected getHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };
  }

  protected buildRequestBody(
    messages: ChatMessage[],
    systemPrompt: string,
    model: string
  ): object {
    return {
      model,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    };
  }

  protected parseStreamChunk(line: string): string | null {
    if (!line.startsWith('data: ')) return null;
    const data = line.slice(6);
    if (data === '[DONE]') return null;

    try {
      const json = JSON.parse(data);
      return json.choices?.[0]?.delta?.content || null;
    } catch {
      return null;
    }
  }

  validateApiKey(key: string): boolean {
    return key.startsWith('sk-') && key.length > 20;
  }
}
