'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  PropsWithChildren,
  useRef,
} from 'react';
import {
  LLMProvider,
  ChatMessage,
  AIAssistantConfig,
  StoredAPIKeys,
  ChatSession,
  PendingExecution,
  STORAGE_KEYS,
  MAX_MESSAGES_PER_SESSION,
  generateMessageId,
  getProvider,
  getProviderConfigs,
  buildPromptWithDeviceContext,
  extractShellCommand,
} from '@/services/llm';
import { useDevice } from './device-context';

interface AIAssistantContextType {
  // Panel state
  isPanelOpen: boolean;
  togglePanel: () => void;
  setPanelOpen: (open: boolean) => void;

  // Configuration
  config: AIAssistantConfig | null;
  apiKey: string;
  setProvider: (provider: LLMProvider) => void;
  setModel: (model: string) => void;
  setApiKey: (key: string) => void;
  isConfigured: boolean;

  // Chat state
  messages: ChatMessage[];
  isLoading: boolean;
  isInterpreting: boolean;
  streamingContent: string;
  error: string | null;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  clearHistory: () => void;
  stopGeneration: () => void;

  // Command execution callback (set by shell page)
  executeCommandRef: React.MutableRefObject<((cmd: string) => void) | null>;
  // Command output callback (set by shell page to notify when command completes)
  onCommandOutputRef: React.MutableRefObject<((command: string, output: string, error: string | null) => void) | null>;
}

const AIAssistantContext = createContext<AIAssistantContextType | null>(null);

export function AIAssistantProvider({ children }: PropsWithChildren) {
  const { deviceInfo } = useDevice();

  // Panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Config state
  const [config, setConfig] = useState<AIAssistantConfig | null>(null);
  const [apiKeys, setApiKeys] = useState<StoredAPIKeys>({});
  const currentApiKey = config ? apiKeys[config.provider] || '' : '';

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Command execution callback
  const executeCommandRef = useRef<((cmd: string) => void) | null>(null);
  // Command output callback
  const onCommandOutputRef = useRef<((command: string, output: string, error: string | null) => void) | null>(null);
  // Pending execution tracking
  const pendingExecutionRef = useRef<PendingExecution | null>(null);
  // Ref to track current messages (for use in callbacks)
  const messagesRef = useRef<ChatMessage[]>([]);

  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;

    // Load panel state
    const savedPanelOpen = localStorage.getItem(STORAGE_KEYS.AI_PANEL_OPEN);
    if (savedPanelOpen) {
      setIsPanelOpen(savedPanelOpen === 'true');
    }

    // Load config
    const savedConfig = localStorage.getItem(STORAGE_KEYS.AI_CONFIG);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(parsed);
      } catch {
        // Use default
        const configs = getProviderConfigs();
        if (configs.length > 0) {
          setConfig({ provider: configs[0].id, model: configs[0].defaultModel });
        }
      }
    } else {
      // Set default config
      const configs = getProviderConfigs();
      if (configs.length > 0) {
        setConfig({ provider: configs[0].id, model: configs[0].defaultModel });
      }
    }

    // Load API keys
    const savedKeys = localStorage.getItem(STORAGE_KEYS.AI_API_KEYS);
    if (savedKeys) {
      try {
        const parsed = JSON.parse(savedKeys);
        // Decode keys
        const decoded: StoredAPIKeys = {};
        for (const [provider, key] of Object.entries(parsed)) {
          try {
            decoded[provider] = atob(key as string);
          } catch {
            decoded[provider] = key as string;
          }
        }
        setApiKeys(decoded);
      } catch {
        // Ignore
      }
    }
  }, []);

  // Load chat history when device changes
  useEffect(() => {
    if (typeof localStorage === 'undefined' || !deviceInfo?.serial) return;

    const chatKey = `${STORAGE_KEYS.AI_CHAT_PREFIX}${deviceInfo.serial}`;
    const savedChat = localStorage.getItem(chatKey);

    if (savedChat) {
      try {
        const session: ChatSession = JSON.parse(savedChat);
        setMessages(
          session.messages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }))
        );
      } catch {
        setMessages([]);
      }
    } else {
      setMessages([]);
    }
  }, [deviceInfo?.serial]);

  // Save config to localStorage
  const saveConfig = useCallback((newConfig: AIAssistantConfig) => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AI_CONFIG, JSON.stringify(newConfig));
    }
  }, []);

  // Save API keys to localStorage
  const saveApiKeys = useCallback((keys: StoredAPIKeys) => {
    if (typeof localStorage !== 'undefined') {
      const encoded: StoredAPIKeys = {};
      for (const [provider, key] of Object.entries(keys)) {
        encoded[provider] = btoa(key);
      }
      localStorage.setItem(STORAGE_KEYS.AI_API_KEYS, JSON.stringify(encoded));
    }
  }, []);

  // Save chat to localStorage
  const saveChat = useCallback(
    (newMessages: ChatMessage[]) => {
      if (typeof localStorage === 'undefined' || !deviceInfo?.serial) return;

      const chatKey = `${STORAGE_KEYS.AI_CHAT_PREFIX}${deviceInfo.serial}`;
      const session: ChatSession = {
        deviceSerial: deviceInfo.serial,
        messages: newMessages.slice(-MAX_MESSAGES_PER_SESSION).map((m) => ({
          ...m,
          timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
        })) as unknown as ChatMessage[],
        provider: config?.provider || 'openai',
        model: config?.model || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(chatKey, JSON.stringify(session));
    },
    [deviceInfo?.serial, config]
  );

  // Panel toggle
  const togglePanel = useCallback(() => {
    setIsPanelOpen((prev) => {
      const newValue = !prev;
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.AI_PANEL_OPEN, String(newValue));
      }
      return newValue;
    });
  }, []);

  const setPanelOpen = useCallback((open: boolean) => {
    setIsPanelOpen(open);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.AI_PANEL_OPEN, String(open));
    }
  }, []);

  // Set provider
  const setProvider = useCallback(
    (provider: LLMProvider) => {
      const providerConfig = getProviderConfigs().find((p) => p.id === provider);
      if (providerConfig) {
        const newConfig = { provider, model: providerConfig.defaultModel };
        setConfig(newConfig);
        saveConfig(newConfig);
      }
    },
    [saveConfig]
  );

  // Set model
  const setModel = useCallback(
    (model: string) => {
      if (config) {
        const newConfig = { ...config, model };
        setConfig(newConfig);
        saveConfig(newConfig);
      }
    },
    [config, saveConfig]
  );

  // Set API key
  const setApiKey = useCallback(
    (key: string) => {
      if (config) {
        const newKeys = { ...apiKeys, [config.provider]: key };
        setApiKeys(newKeys);
        saveApiKeys(newKeys);
      }
    },
    [config, apiKeys, saveApiKeys]
  );

  // Check if configured
  const isConfigured = Boolean(config && currentApiKey);

  // Stop generation
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setStreamingContent('');
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!config || !currentApiKey || !content.trim()) return;

      setError(null);
      setIsLoading(true);
      setStreamingContent('');

      // Add user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      try {
        const provider = getProvider(config.provider);
        const systemPrompt = buildPromptWithDeviceContext({
          model: deviceInfo?.model,
          androidVersion: deviceInfo?.androidVersion,
          manufacturer: deviceInfo?.manufacturer,
          serial: deviceInfo?.serial,
        });

        abortControllerRef.current = new AbortController();

        let fullResponse = '';

        const response = await provider.sendMessage(
          updatedMessages,
          systemPrompt,
          currentApiKey,
          config.model,
          (chunk) => {
            fullResponse += chunk;
            setStreamingContent(fullResponse);
          }
        );

        // Extract shell command if present
        const shellCommand = extractShellCommand(response);

        // Add assistant message
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          shellCommand: shellCommand || undefined,
          awaitingOutput: shellCommand ? true : undefined,
        };

        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        saveChat(finalMessages);

        // Auto-execute command if found and set up pending execution for interpretation
        if (shellCommand && executeCommandRef.current) {
          pendingExecutionRef.current = {
            messageId: assistantMessage.id,
            command: shellCommand,
            userQuery: content.trim(),
          };
          executeCommandRef.current(shellCommand);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // User cancelled
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to get response';
        setError(message);
      } finally {
        setIsLoading(false);
        setStreamingContent('');
        abortControllerRef.current = null;
      }
    },
    [config, currentApiKey, messages, deviceInfo, saveChat]
  );

  // Handle command output and request interpretation
  const handleCommandOutput = useCallback(
    async (command: string, output: string, cmdError: string | null) => {
      const pending = pendingExecutionRef.current;
      if (!pending || !config || !currentApiKey) {
        pendingExecutionRef.current = null;
        return;
      }

      // Clear pending
      pendingExecutionRef.current = null;

      // Get current messages from ref (to avoid stale closure) and update the awaiting state
      const currentMessages = messagesRef.current.map((m) =>
        m.id === pending.messageId
          ? { ...m, awaitingOutput: false, commandOutput: cmdError || output }
          : m
      );
      setMessages(currentMessages);
      saveChat(currentMessages);

      // Skip interpretation if output is empty and no error
      const trimmedOutput = output.trim();
      if (!trimmedOutput && !cmdError) {
        return;
      }

      // Now request interpretation from LLM
      setIsInterpreting(true);
      setStreamingContent('');

      try {
        const provider = getProvider(config.provider);
        const systemPrompt = buildPromptWithDeviceContext({
          model: deviceInfo?.model,
          androidVersion: deviceInfo?.androidVersion,
          manufacturer: deviceInfo?.manufacturer,
          serial: deviceInfo?.serial,
        });

        // Build context for interpretation - full history + command output
        const outputMessage: ChatMessage = {
          id: 'ctx-output',
          role: 'user',
          content: cmdError
            ? `Command failed with error:\n${cmdError}`
            : `Command output:\n${output}`,
          timestamp: new Date(),
        };

        // Send full chat history plus the command output
        const interpretationContext: ChatMessage[] = [...currentMessages, outputMessage];

        let fullResponse = '';

        const response = await provider.sendMessage(
          interpretationContext,
          systemPrompt,
          currentApiKey,
          config.model,
          (chunk) => {
            fullResponse += chunk;
            setStreamingContent(fullResponse);
          }
        );

        // Add interpretation message
        const interpretationMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          isInterpretation: true,
        };

        setMessages((prev) => {
          const newMessages = [...prev, interpretationMessage];
          saveChat(newMessages);
          return newMessages;
        });
      } catch (err) {
        // If interpretation fails, just show a note - user still has raw output
        const errorMessage = err instanceof Error ? err.message : 'Failed to interpret output';
        setError(`Interpretation failed: ${errorMessage}`);
      } finally {
        setIsInterpreting(false);
        setStreamingContent('');
      }
    },
    [config, currentApiKey, deviceInfo, saveChat]
  );

  // Set up the output callback
  useEffect(() => {
    onCommandOutputRef.current = handleCommandOutput;
    return () => {
      onCommandOutputRef.current = null;
    };
  }, [handleCommandOutput]);

  // Clear history
  const clearHistory = useCallback(() => {
    setMessages([]);
    pendingExecutionRef.current = null;
    if (typeof localStorage !== 'undefined' && deviceInfo?.serial) {
      const chatKey = `${STORAGE_KEYS.AI_CHAT_PREFIX}${deviceInfo.serial}`;
      localStorage.removeItem(chatKey);
    }
  }, [deviceInfo?.serial]);

  return (
    <AIAssistantContext.Provider
      value={{
        isPanelOpen,
        togglePanel,
        setPanelOpen,
        config,
        apiKey: currentApiKey,
        setProvider,
        setModel,
        setApiKey,
        isConfigured,
        messages,
        isLoading,
        isInterpreting,
        streamingContent,
        error,
        sendMessage,
        clearHistory,
        stopGeneration,
        executeCommandRef,
        onCommandOutputRef,
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant() {
  const context = useContext(AIAssistantContext);
  if (!context) {
    throw new Error('useAIAssistant must be used within AIAssistantProvider');
  }
  return context;
}
