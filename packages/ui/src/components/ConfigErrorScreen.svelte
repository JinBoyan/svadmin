<script lang="ts">
  import { t } from '@svadmin/core/i18n';
  import { AlertTriangle, Copy, CheckCircle } from 'lucide-svelte';
  import { Button } from './ui/button/index.js';
  import * as Card from './ui/card/index.js';

  let { title = 'Configuration Required', missingVars = [], envTemplate = '' } = $props<{
    title?: string;
    missingVars?: { key: string; description?: string }[];
    envTemplate?: string;
  }>();

  let copied = $state<Record<string, boolean>>({});

  async function copyToClipboard(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      copied = { ...copied, [key]: true };
      setTimeout(() => {
        copied = { ...copied, [key]: false };
      }, 2000);
    } catch {
      console.warn('[svadmin] clipboard API unavailable');
    }
  }

  async function copyAll() {
    const text = envTemplate || missingVars.map((v: { key: string }) => `${v.key}=`).join('\n');
    await copyToClipboard(text, '__all__');
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/[0.05] via-background to-destructive/[0.03] p-4">
  <div class="w-full max-w-[480px]">
    <Card.Card class="backdrop-blur-xl border-border/50 shadow-[0_8px_32px_hsl(var(--destructive)/0.08),0_2px_8px_hsl(0_0%_0%/0.06)]">
      <Card.CardHeader class="text-center pb-2">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-[14px] bg-destructive/10 text-destructive mx-auto mb-3">
          <AlertTriangle class="h-7 w-7" />
        </div>
        <Card.CardTitle class="text-xl font-bold">{title}</Card.CardTitle>
        <p class="text-sm text-muted-foreground">
          {t('config.missingEnvDescription')}
        </p>
      </Card.CardHeader>
      <Card.CardContent class="space-y-4">
        {#if missingVars.length > 0}
          <div class="rounded-lg border overflow-hidden">
            {#each missingVars as v, i (v.key)}
              <div class="flex items-center justify-between px-3 py-2.5 gap-2 {i < missingVars.length - 1 ? 'border-b border-border/50' : ''}">
                <div class="flex flex-col gap-0.5 min-w-0">
                  <code class="text-[0.8125rem] font-semibold text-foreground font-mono">{v.key}</code>
                  {#if v.description}
                    <span class="text-[0.6875rem] text-muted-foreground">{v.description}</span>
                  {/if}
                </div>
                <button
                  class="flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded px-2 py-1 transition-all shrink-0"
                  onclick={() => copyToClipboard(`${v.key}=`, v.key)}
                  title="Copy"
                >
                  {#if copied[v.key]}
                    <CheckCircle class="h-3.5 w-3.5 text-green-500" />
                  {:else}
                    <Copy class="h-3.5 w-3.5" />
                  {/if}
                </button>
              </div>
            {/each}
          </div>
        {/if}

        {#if envTemplate}
          <div class="rounded-lg border overflow-hidden">
            <div class="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border/50">
              <span class="text-xs font-medium text-muted-foreground">{t('config.envFilePath')}</span>
              <button
                class="flex items-center gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded px-2 py-1 transition-all shrink-0"
                onclick={copyAll}
              >
                {#if copied['__all__']}
                  <CheckCircle class="h-3.5 w-3.5 text-green-500" />
                  <span class="text-xs">Copied!</span>
                {:else}
                  <Copy class="h-3.5 w-3.5" />
                  <span class="text-xs">Copy All</span>
                {/if}
              </button>
            </div>
            <pre class="px-3 py-3 text-xs font-mono leading-relaxed text-foreground bg-muted/20 m-0 whitespace-pre-wrap break-all">{envTemplate}</pre>
          </div>
        {/if}

        <p class="text-xs text-muted-foreground text-center mt-4">
          {t('config.reload')}
        </p>

        <Button variant="outline" class="w-full" onclick={() => window.location.reload()}>
          Reload Page
        </Button>
      </Card.CardContent>
    </Card.Card>
  </div>
</div>
