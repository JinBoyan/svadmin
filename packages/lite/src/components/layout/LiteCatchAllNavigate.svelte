<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    basePath?: string;
    defaultResource?: string;
  }

  let { basePath = '/lite', defaultResource = '' }: Props = $props();
  const target = $derived(`${basePath}${defaultResource ? '/' + defaultResource : ''}`);

  onMount(() => {
    window.location.href = target;
  });
</script>

<noscript>
  <meta http-equiv="refresh" content={`0; url=${target}`} />
</noscript>
<p>Redirecting...</p>
