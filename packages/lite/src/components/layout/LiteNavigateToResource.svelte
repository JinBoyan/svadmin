<script lang="ts">
  /**
   * SSR redirection helper component
   * Normally redirection is done via +page.server.ts load() function in SvelteKit.
   * This component will do a client-side fallback redirect if rendered.
   */
  import { onMount } from 'svelte';

  interface Props {
    resource: string;
    basePath?: string;
  }

  let { resource, basePath = '/lite' }: Props = $props();

  onMount(() => {
    // Only fires if JS somehow runs, otherwise server should have redirected.
    window.location.href = `${basePath}/${resource}`;
  });
</script>

<noscript>
  <meta http-equiv="refresh" content={`0; url=${basePath}/${resource}`} />
</noscript>
<p>Redirecting to {resource}...</p>
