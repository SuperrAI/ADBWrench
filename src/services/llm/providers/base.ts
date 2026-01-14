import {
  LLMProviderAdapter,
  LLMProviderConfig,
  LLMProvider,
  ChatMessage,
  StreamCallback,
} from '../types';

export abstract class BaseLLMProvider implements LLMProviderAdapter {
  abstract readonly providerId: LLMProvider;
  abstract readonly config: LLMProviderConfig;
  protected abstract readonly endpoint: string;

  protected abstract getHeaders(apiKey: string): Record<string, string>;
  protected abstract buildRequestBody(
    messages: ChatMessage[],
    systemPrompt: string,
    model: string
  ): object;
  protected abstract parseStreamChunk(chunk: string): string | null;

  async sendMessage(
    messages: ChatMessage[],
    systemPrompt: string,
    apiKey: string,
    model: string,
    onStream: StreamCallback
  ): Promise<string> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.getHeaders(apiKey),
      body: JSON.stringify(this.buildRequestBody(messages, systemPrompt, model)),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorJson.message || errorMessage;
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

  abstract validateApiKey(key: string): boolean;
}
