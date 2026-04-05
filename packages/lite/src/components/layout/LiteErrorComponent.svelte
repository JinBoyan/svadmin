<script lang="ts">
  import { t } from '@svadmin/core/i18n';
  import { AlertTriangle } from '@lucide/svelte';

  interface Props {
    title?: string;
    message?: string;
    code?: string | number;
    homeUrl?: string;
  }

  let {
    title = 'An error occurred',
    message = 'Something went wrong while processing your request.',
    code = 500,
    homeUrl = '/lite',
  }: Props = $props();
</script>

<div style="min-height: 50vh; display: flex; align-items: center; justify-content: center; padding: 20px;">
  <div class="lite-card" style="max-width: 480px; width: 100%; text-align: center; padding: 40px;">
    <AlertTriangle style="width: 48px; height: 48px; color: #ef4444; margin: 0 auto 16px;" />
    
    <h1 style="font-size: 24px; font-weight: 600; color: #0f172a; margin: 0 0 8px;">
      {#if code}
        <span style="color: #ef4444; margin-right: 8px;">{code}</span>
      {/if}
      {title}
    </h1>
    
    <p style="color: #64748b; font-size: 15px; margin: 0 0 24px; line-height: 1.5;">{message}</p>
    
    <a href={homeUrl} class="lite-btn lite-btn-primary" style="display: inline-block;">
      {t('common.returnHome') || 'Return to Home'}
    </a>
  </div>
</div>
