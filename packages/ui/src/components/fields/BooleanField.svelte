<script lang="ts">
  interface Props { value: boolean | null | undefined; trueIcon?: string; falseIcon?: string }
  let { value, trueIcon = '✓', falseIcon = '✗' }: Props = $props();
</script>
{#if value}
  <span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-sm bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
    {trueIcon}
  </span>
{:else}
  <span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-sm bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400">
    {falseIcon}
  </span>
{/if}
