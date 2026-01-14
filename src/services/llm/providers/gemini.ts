import { BaseLLMProvider } from './base';
import { LLMProvider, LLMProviderConfig, ChatMessage, StreamCallback } from '../types';

export class GeminiProvider extends BaseLLMProvider {
  readonly providerId: LLMProvider = 'gemini';
  protected readonly endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';

  readonly config: LLMProviderConfig = {
    id: 'gemini',
    name: 'Google Gemini',
    apiKeyPlaceholder: 'AIza...',
    models: [
      { id: 'gemini-3-pro', name: 'Gemini 3 Pro' },
      { id: 'gemini-3-flash', name: 'Gemini 3 Flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    ],
    defaultModel: 'gemini-2.5-flash',
  };

  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
    };
  }

  protected buildRequestBody(
    messages: ChatMessage[],
    systemPrompt: string
  ): object {
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    return {
      contents,
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        maxOutputTokens: 4096,
      },
    };
  }

  async sendMessage(
    messages: ChatMessage[],
    systemPrompt: string,
    apiKey: string,
    model: string,
    onStream: StreamCallback
  ): Promise<string> {
    const url = `${this.endpoint}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(this.buildRequestBody(messages, systemPrompt)),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        if (errorText) errorMessage = errorText;
      }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    let fullResponse = '';
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          const parsed = this.parseStreamChunk(line);
          if (parsed) {
            fullResponse += parsed;
            onStream(parsed);
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse;
  }

  protected parseStreamChunk(line: string): string | null {
    if (!line.startsWith('data: ')) return null;
    const data = line.slice(6);

    try {
      const json = JSON.parse(data);
      return json.candidates?.[0]?.content?.parts?.[0]?.text || null;
    } catch {
      return null;
    }
  }

  validateApiKey(key: string): boolean {
    return key.startsWith('AIza') && key.length > 20;
  }
}
