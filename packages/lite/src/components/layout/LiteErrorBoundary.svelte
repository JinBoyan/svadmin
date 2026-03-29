<script lang="ts">
  /**
   * SSR Error Boundary.
   * Since native Svelte <svelte:boundary> relies on CSR to catch JS exceptions, 
   * this component delegates error handling upstream to the SvelteKit +error.svelte mechanism.
   * In CSR disabled environments, returning just the slot is standard practice.
   */
  import type { Snippet } from 'svelte';
  
  interface Props {
    children?: Snippet;
  }
  
  let { children }: Props = $props();
</script>

<!-- The error interception must be handled by the backend SSR framework (e.g. SvelteKit) -->
{#if children}
  {@render children()}
{/if}
