<script lang="ts">
  import { useRegister } from '@svadmin/core';
  import { t } from '@svadmin/core/i18n';
  import { navigate } from '@svadmin/core/router';
  import { Button } from './ui/button/index.js';
  import { Input } from './ui/input/index.js';
  import * as Card from './ui/card/index.js';
  import * as Alert from './ui/alert/index.js';
  import { UserPlus, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-svelte';

  let { title = 'Admin', onSuccess } = $props<{
    title?: string;
    onSuccess?: () => void;
  }>();

  const register = useRegister();

  let email = $state('');
  let password = $state('');
  let confirmPassword = $state('');
  let showPassword = $state(false);
  let error = $state('');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    error = '';

    if (!email) { error = t('auth.emailRequired'); return; }
    if (!password) { error = t('auth.passwordRequired'); return; }
    if (password !== confirmPassword) { error = t('auth.passwordMismatch'); return; }

    const result = await register.mutate({ email, password });
    if (result.success) {
      onSuccess?.();
    } else {
      error = result.error?.message ?? t('common.operationFailed');
    }
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/[0.08] via-background to-primary/[0.04] p-4">
  <div class="w-full max-w-[420px]">
    <Card.Card class="backdrop-blur-xl border-border/50 shadow-[0_8px_32px_hsl(var(--primary)/0.08),0_2px_8px_hsl(0_0%_0%/0.06)]">
      <Card.CardHeader class="text-center pb-2">
        <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mx-auto mb-3">
          <UserPlus class="h-6 w-6" />
        </div>
        <Card.CardTitle class="text-2xl font-bold">{t('auth.createAccount')}</Card.CardTitle>
        <p class="text-sm text-muted-foreground">{t('auth.createAccountMessage')}</p>
      </Card.CardHeader>
      <Card.CardContent>
        <form onsubmit={handleSubmit} class="space-y-4">
          {#if error}
            <Alert.Root variant="destructive">
              <AlertCircle class="h-4 w-4" />
              <Alert.Description>{error}</Alert.Description>
            </Alert.Root>
          {/if}

          <div class="space-y-2">
            <label for="register-email" class="text-sm font-medium text-foreground">{t('auth.email')}</label>
            <div class="relative">
              <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-[1]" />
              <Input
                id="register-email"
                type="email"
                placeholder="name@example.com"
                bind:value={email}
                class="pl-9"
                autocomplete="email"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label for="register-password" class="text-sm font-medium text-foreground">{t('auth.password')}</label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-[1]" />
              <Input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                bind:value={password}
                class="pl-9 pr-9"
                autocomplete="new-password"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 z-[1]"
                onclick={() => showPassword = !showPassword}
                tabindex={-1}
              >
                {#if showPassword}
                  <EyeOff class="h-4 w-4" />
                {:else}
                  <Eye class="h-4 w-4" />
                {/if}
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <label for="register-confirm" class="text-sm font-medium text-foreground">{t('auth.confirmPassword')}</label>
            <div class="relative">
              <Lock class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-[1]" />
              <Input
                id="register-confirm"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                bind:value={confirmPassword}
                class="pl-9"
                autocomplete="new-password"
              />
            </div>
          </div>

          <Button type="submit" class="w-full" disabled={register.isLoading}>
            {#if register.isLoading}
              <Loader2 class="h-4 w-4 animate-spin mr-2" />
            {/if}
            {t('auth.registerButton')}
          </Button>
        </form>

        <div class="flex items-center justify-center gap-1 mt-5 pt-5 border-t">
          <span class="text-sm text-muted-foreground">{t('auth.hasAccount')}</span>
          <button
            type="button"
            class="text-sm text-primary hover:underline font-medium"
            onclick={() => navigate('/login')}
          >{t('auth.login')}</button>
        </div>
      </Card.CardContent>
    </Card.Card>

    <p class="text-xs text-muted-foreground mt-4 text-center opacity-60">
      Powered by {title}
    </p>
  </div>
</div>
