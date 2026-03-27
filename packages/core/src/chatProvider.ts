// Chat provider — headless interface for AI chat integration

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/**
 * ChatProvider interface for integrating AI chat into admin panels.
 * Implement `sendMessage` to connect to any AI backend (OpenAI, self-hosted, etc.)
 *
 * Return a `string` for non-streaming responses, or an `AsyncGenerator<string>`
 * for streaming (SSE / chunked) responses.
 */
export interface ChatProvider {
  sendMessage(
    messages: ChatMessage[],
    options?: { signal?: AbortSignal },
  ): Promise<string> | AsyncGenerator<string, void, unknown>;
}

let chatProvider: ChatProvider | null = null;

export function setChatProvider(provider: ChatProvider): void {
  chatProvider = provider;
}

export function getChatProvider(): ChatProvider | null {
  return chatProvider;
}
