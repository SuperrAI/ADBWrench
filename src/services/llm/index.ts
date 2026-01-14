export * from './types';
export { getProvider, getAllProviders, getProviderConfigs, getAvailableProviderIds } from './providers';
export { ADB_SHELL_SYSTEM_PROMPT, buildPromptWithDeviceContext } from './prompts/adb-shell';

// Utility to extract shell command from LLM response
export function extractShellCommand(response: string): string | null {
  const match = response.match(/<shell>([\s\S]*?)<\/shell>/);
  return match ? match[1].trim() : null;
}

// Utility to generate unique message ID
export function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
