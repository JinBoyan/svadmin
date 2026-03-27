<script lang="ts">
  import { getChatProvider } from '@svadmin/core';
  import type { ChatMessage } from '@svadmin/core';
  import { t } from '@svadmin/core/i18n';
  import { fly, fade, scale } from 'svelte/transition';
  import { Button } from './ui/button/index.js';
  import TooltipButton from './TooltipButton.svelte';
  import { MessageCircle, X, Minus, Send, Loader2, Bot, Trash2 } from 'lucide-svelte';

  let open = $state(false);
  let minimized = $state(false);
  let inputValue = $state('');
  let messages = $state<ChatMessage[]>([]);
  let isStreaming = $state(false);
  let messagesContainer: HTMLDivElement | undefined = $state();
  let abortController: AbortController | null = null;
  let messageIdCounter = $state(0);

  const provider = $derived(getChatProvider());

  function genId(): string {
    messageIdCounter++;
    return `msg-${Date.now()}-${messageIdCounter}`;
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    });
  }

  async function sendMessage() {
    if (!inputValue.trim() || isStreaming || !provider) return;

    const userMsg: ChatMessage = {
      id: genId(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    messages = [...messages, userMsg];
    inputValue = '';
    scrollToBottom();

    // Create placeholder assistant message
    const assistantMsg: ChatMessage = {
      id: genId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    messages = [...messages, assistantMsg];
    isStreaming = true;
    scrollToBottom();

    abortController = new AbortController();

    try {
      const result = provider.sendMessage(
        messages.filter((m) => m.content), // exclude empty placeholder
        { signal: abortController.signal },
      );

      if (result && typeof result === 'object' && Symbol.asyncIterator in result) {
        // Streaming response
        for await (const chunk of result as AsyncGenerator<string>) {
          assistantMsg.content += chunk;
          messages = [...messages.slice(0, -1), { ...assistantMsg }];
          scrollToBottom();
        }
      } else {
        // Non-streaming response
        const text = await (result as Promise<string>);
        assistantMsg.content = text;
        messages = [...messages.slice(0, -1), { ...assistantMsg }];
        scrollToBottom();
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      assistantMsg.content = t('chat.error') || 'Sorry, something went wrong. Please try again.';
      messages = [...messages.slice(0, -1), { ...assistantMsg }];
    } finally {
      isStreaming = false;
      abortController = null;
      scrollToBottom();
    }
  }

  function stopStreaming() {
    if (abortController) {
      abortController.abort();
      isStreaming = false;
      abortController = null;
    }
  }

  function clearChat() {
    messages = [];
    isStreaming = false;
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleGlobalKeydown(e: KeyboardEvent) {
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      if (open && !minimized) {
        open = false;
      } else {
        open = true;
        minimized = false;
      }
    }
  }

  /** Simple markdown→html: bold, italic, code blocks, inline code, line breaks */
  function renderMarkdown(text: string): string {
    return text
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="chat-code-block"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  const suggestions = $derived([
    t('chat.suggestion1') || 'How do I create a new resource?',
    t('chat.suggestion2') || 'Explain the data model',
    t('chat.suggestion3') || 'Help me write a filter query',
  ]);
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

{#if provider}
  <!-- FAB Button -->
  {#if !open}
    <div transition:scale={{ duration: 200 }}>
      <TooltipButton
        tooltip={t('chat.title') || 'AI Assistant'}
        variant="default"
        size="icon"
        class="fixed bottom-6 right-6 z-[9998] h-12 w-12 rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all bg-primary text-primary-foreground"
        onclick={() => { open = true; minimized = false; }}
      >
        <MessageCircle class="h-5 w-5" />
        {#if messages.length > 0}
          <span class="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
            {messages.filter(m => m.role === 'assistant').length}
          </span>
        {/if}
      </TooltipButton>
    </div>
  {/if}

  <!-- Chat Panel -->
  {#if open}
    <div
      class="fixed bottom-6 right-6 z-[9998] flex flex-col rounded-2xl border bg-card shadow-2xl overflow-hidden"
      class:w-[400px]={!minimized}
      class:h-[560px]={!minimized}
      class:w-[280px]={minimized}
      class:h-auto={minimized}
      transition:fly={{ y: 300, duration: 250 }}
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground shrink-0">
        <div class="flex items-center gap-2.5">
          <div class="flex items-center justify-center h-7 w-7 rounded-full bg-primary-foreground/20">
            <Bot class="h-4 w-4" />
          </div>
          <div>
            <h3 class="text-sm font-semibold leading-none">
              {t('chat.title') || 'AI Assistant'}
            </h3>
            {#if isStreaming}
              <p class="text-[10px] opacity-80 mt-0.5">{t('chat.typing') || 'Typing...'}</p>
            {/if}
          </div>
        </div>
        <div class="flex items-center gap-0.5">
          {#if messages.length > 0}
            <TooltipButton
              tooltip={t('chat.clear') || 'Clear'}
              variant="ghost"
              size="icon"
              class="h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onclick={clearChat}
            >
              <Trash2 class="h-3.5 w-3.5" />
            </TooltipButton>
          {/if}
          <TooltipButton
            tooltip={minimized ? (t('common.expand') || 'Expand') : (t('common.collapse') || 'Minimize')}
            variant="ghost"
            size="icon"
            class="h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onclick={() => minimized = !minimized}
          >
            <Minus class="h-3.5 w-3.5" />
          </TooltipButton>
          <TooltipButton
            tooltip={t('common.close') || 'Close'}
            variant="ghost"
            size="icon"
            class="h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onclick={() => open = false}
          >
            <X class="h-3.5 w-3.5" />
          </TooltipButton>
        </div>
      </div>

      {#if !minimized}
        <!-- Messages -->
        <div
          bind:this={messagesContainer}
          class="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
        >
          {#if messages.length === 0}
            <!-- Welcome state -->
            <div class="flex flex-col items-center justify-center h-full text-center px-4" in:fade={{ duration: 200 }}>
              <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bot class="h-6 w-6 text-primary" />
              </div>
              <h4 class="text-sm font-semibold text-foreground mb-1">
                {t('chat.welcome') || 'How can I help?'}
              </h4>
              <p class="text-xs text-muted-foreground mb-4">
                {t('chat.welcomeDesc') || 'Ask me anything about your admin panel.'}
              </p>
              <div class="flex flex-col gap-2 w-full max-w-[240px]">
                {#each suggestions as suggestion}
                  <button
                    class="text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                    onclick={() => { inputValue = suggestion; }}
                  >
                    {suggestion}
                  </button>
                {/each}
              </div>
            </div>
          {:else}
            {#each messages as msg (msg.id)}
              <div
                class="flex {msg.role === 'user' ? 'justify-end' : 'justify-start'}"
                in:fly={{ y: 10, duration: 150 }}
              >
                <div
                  class="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed {msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'}"
                >
                  {#if msg.role === 'assistant'}
                    {#if msg.content}
                      <div class="chat-markdown">{@html renderMarkdown(msg.content)}</div>
                    {:else}
                      <div class="flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 class="h-3.5 w-3.5 animate-spin" />
                        <span class="text-xs">{t('chat.thinking') || 'Thinking...'}</span>
                      </div>
                    {/if}
                  {:else}
                    {msg.content}
                  {/if}
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <!-- Input area -->
        <div class="shrink-0 border-t bg-card p-3">
          <div class="flex items-end gap-2">
            <textarea
              bind:value={inputValue}
              onkeydown={handleKeydown}
              placeholder={t('chat.placeholder') || 'Type a message...'}
              rows={1}
              disabled={isStreaming}
              class="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50 max-h-[100px] min-h-[40px]"
            ></textarea>
            {#if isStreaming}
              <Button
                variant="destructive"
                size="icon"
                class="h-10 w-10 rounded-xl shrink-0"
                onclick={stopStreaming}
              >
                <X class="h-4 w-4" />
              </Button>
            {:else}
              <Button
                variant="default"
                size="icon"
                class="h-10 w-10 rounded-xl shrink-0"
                onclick={sendMessage}
                disabled={!inputValue.trim()}
              >
                <Send class="h-4 w-4" />
              </Button>
            {/if}
          </div>
          <p class="text-[10px] text-muted-foreground mt-1.5 text-center">
            <kbd class="px-1 py-0.5 rounded border border-border bg-muted text-[9px] font-mono">Ctrl+Shift+L</kbd>
            {t('chat.shortcutHint') || 'to toggle'}
          </p>
        </div>
      {/if}
    </div>
  {/if}
{/if}

<style>
  :global(.chat-markdown pre.chat-code-block) {
    background: hsl(var(--muted));
    border-radius: 0.5rem;
    padding: 0.75rem;
    margin: 0.5rem 0;
    overflow-x: auto;
    font-size: 0.75rem;
    line-height: 1.5;
  }
  :global(.chat-markdown code.chat-inline-code) {
    background: hsl(var(--muted));
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.8125em;
    font-family: ui-monospace, monospace;
  }
  :global(.chat-markdown strong) {
    font-weight: 600;
  }
</style>
