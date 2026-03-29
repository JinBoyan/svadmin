<script lang="ts">
  import type { FieldDefinition } from '@svadmin/core';

  interface Props {
    field: FieldDefinition;
    value?: unknown;
    error?: string[];
    mode?: 'show' | 'edit' | 'create';
  }

  let { field, value, error = [], mode = 'show' }: Props = $props();
  const hasError = error.length > 0;
</script>

{#if mode === 'show'}
  <!-- SSR fallback for rich text: render raw HTML if safe, or escaped. 
       We use standard HTML output for SSR. If it includes scripts, 
       backend should have sanitized it. -->
  <div style="padding: 12px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 4px; max-height: 400px; overflow-y: auto;">
    {@html String(value ?? '—')}
  </div>
{:else}
  <div>
    <textarea
      name={field.key}
      id={field.key}
      class="lite-input {hasError ? 'lite-input-error' : ''}"
      style="min-height: 200px; font-family: monospace;"
      placeholder="Wait... Rich Text Editor is not available in lite mode. You can edit the raw HTML source here."
      {...field.required ? { required: true } : {}}
    >{String(value ?? '')}</textarea>
    {#if hasError}
      {#each error as err}
        <div class="lite-error-text">{err}</div>
      {/each}
    {/if}
  </div>
{/if}
