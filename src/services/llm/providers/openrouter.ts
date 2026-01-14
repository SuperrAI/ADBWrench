import { ChatMessage, LLMProvider, LLMProviderConfig } from '../types';
import { BaseLLMProvider } from './base';

export class OpenRouterProvider extends BaseLLMProvider {
  readonly providerId: LLMProvider = 'openrouter';
  protected readonly endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  readonly config: LLMProviderConfig = {
    id: 'openrouter',
    name: 'OpenRouter',
    apiKeyPlaceholder: 'sk-or-...',
    models: [
      { id: 'anthropic/claude-opus-4.5', name: 'Claude Opus 4.5' },
      { id: 'openai/gpt-5', name: 'GPT-5' },
      { id: 'google/gemini-3-flash', name: 'Gemini 3 Flash' },
      { id: 'deepseek/deepseek-v3.2', name: 'DeepSeek V3.2' },
      { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick' },
    ],
    defaultModel: 'google/gemini-3-flash',
  };

  protected getHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'SuperrWrench',
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
    return key.startsWith('sk-or-') && key.length > 20;
  }
}
