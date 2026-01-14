// LLM Provider Types

export type LLMProvider = 'anthropic' | 'openai' | 'gemini' | 'openrouter';

export interface LLMProviderConfig {
  id: LLMProvider;
  name: string;
  apiKeyPlaceholder: string;
  models: { id: string; name: string }[];
  defaultModel: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  shellCommand?: string;
  awaitingOutput?: boolean;      // Waiting for command to complete
  commandOutput?: string;        // Captured stdout from command
  isInterpretation?: boolean;    // Is this a follow-up interpretation response
}

export interface PendingExecution {
  messageId: string;
  command: string;
  userQuery: string;
  turnCount: number;
}

export type StreamCallback = (chunk: string) => void;

export interface LLMProviderAdapter {
  readonly providerId: LLMProvider;
  readonly config: LLMProviderConfig;

  sendMessage(
    messages: ChatMessage[],
    systemPrompt: string,
    apiKey: string,
    model: string,
    onStream: StreamCallback
  ): Promise<string>;

  validateApiKey(key: string): boolean;
}

export interface ChatSession {
  deviceSerial: string;
  messages: ChatMessage[];
  provider: LLMProvider;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIAssistantConfig {
  provider: LLMProvider;
  model: string;
}

export interface StoredAPIKeys {
  [provider: string]: string;
}

// Storage keys
export const STORAGE_KEYS = {
  AI_CONFIG: 'superrwrench-ai-config',
  AI_API_KEYS: 'superrwrench-ai-keys',
  AI_CHAT_PREFIX: 'superrwrench-ai-chat-',
  AI_PANEL_OPEN: 'superrwrench-ai-panel-open',
} as const;

export const MAX_MESSAGES_PER_SESSION = 100;
export const MAX_SESSIONS_STORED = 10;
export const MAX_AUTONOMOUS_TURNS = 5;
