<script lang="ts">
  import { useQueryClient } from '@tanstack/svelte-query';
  import { Button } from '../ui/button/index.js';
  import { RefreshCw } from 'lucide-svelte';

  let { resource, hideText = false, class: className = '' } = $props<{
    resource: string;
    hideText?: boolean;
    class?: string;
  }>();

  const queryClient = useQueryClient();
  let spinning = $state(false);

  function refresh() {
    spinning = true;
    queryClient.invalidateQueries({ queryKey: [resource] });
    setTimeout(() => { spinning = false; }, 600);
  }
</script>

<Button
  variant="ghost"
  size={hideText ? 'icon' : 'sm'}
  class={className}
  onclick={refresh}
>
  <RefreshCw class="h-4 w-4 {spinning ? 'animate-spin' : ''}" />
  {#if !hideText}<span class="ml-1">Refresh</span>{/if}
</Button>
