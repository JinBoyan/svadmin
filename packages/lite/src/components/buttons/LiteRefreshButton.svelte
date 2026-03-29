<script lang="ts">
  import { t } from '@svadmin/core/i18n';
  import { RefreshCw } from 'lucide-svelte';

  interface Props {
    hideText?: boolean;
    class?: string;
    size?: 'sm' | 'default' | 'icon';
  }

  let {
    hideText = false,
    class: className = '',
    size = 'default'
  }: Props = $props();
</script>

<a
  href="?"
  class="lite-btn {size === 'sm' ? 'lite-btn-sm' : ''} {className}"
  title={t('common.refresh') || 'Refresh'}
>
  <RefreshCw class="h-4 w-4" />
  {#if !hideText}
    <span style="marginLeft: 4px">{t('common.refresh') || 'Refresh'}</span>
  {/if}
</a>
