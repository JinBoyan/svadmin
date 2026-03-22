<script lang="ts">
  import { useImport, t } from '@svadmin/core';
  import { Button } from '../ui/button/index.js';
  import { Upload } from 'lucide-svelte';

  let { resource, hideText = false, onComplete, class: className = '' } = $props<{
    resource: string;
    hideText?: boolean;
    onComplete?: (result: { success: number; failed: number }) => void;
    class?: string;
  }>();

  const { triggerImport, isLoading } = useImport({
    resource,
    onComplete: (result) => onComplete?.(result),
  });
</script>

<Button
  variant="outline"
  size={hideText ? 'icon' : 'sm'}
  class={className}
  disabled={isLoading}
  onclick={triggerImport}
>
  <Upload class="h-4 w-4" />
  {#if !hideText}<span class="ml-1">{t('common.import')}</span>{/if}
</Button>
