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

  function getFiles(v: unknown): string[] {
    if (!v) return [];
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === 'string') return [v];
    return [];
  }
</script>

{#if mode === 'show'}
  {@const files = getFiles(value)}
  <div style="display:flex; flex-direction: column; gap: 4px;">
    {#each files as f}
      <a href={f} target="_blank" rel="noopener noreferrer">{f.split('/').pop() || 'Download'}</a>
    {:else}
      <span>—</span>
    {/each}
  </div>
{:else}
  <div>
    {@const files = getFiles(value)}
    {#if files.length > 0 && mode === 'edit'}
      <div style="margin-bottom: 8px;">
        <span style="font-size: 12px;">Current files: {files.length}</span>
      </div>
    {/if}
    <input
      type="file"
      name={field.key}
      id={field.key}
      class="lite-input {hasError ? 'lite-input-error' : ''}"
      {...field.type === 'files' ? { multiple: true } : {}}
      {...field.required && !files.length ? { required: true } : {}}
    />
    {#if hasError}
      {#each error as err}
        <div class="lite-error-text">{err}</div>
      {/each}
    {/if}
  </div>
{/if}
