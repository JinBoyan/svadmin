<script lang="ts">
  import { useOne, useCreate, useUpdate, getResource } from '@svadmin/core';
  import type { FieldDefinition } from '@svadmin/core';
  import { navigate } from '@svadmin/core/router';
  import { canAccess } from '@svadmin/core/permissions';
  import { t } from '@svadmin/core/i18n';
  import { Button } from './ui/button/index.js';
  import * as Card from './ui/card/index.js';
  import { Badge } from './ui/badge/index.js';
  import { Save, ArrowLeft, Loader2, AlertCircle } from 'lucide-svelte';
  import FieldRenderer from './FieldRenderer.svelte';
  import * as Alert from './ui/alert/index.js';
  import { Skeleton } from './ui/skeleton/index.js';

  import type { Snippet } from 'svelte';

  interface Props {
    resourceName: string;
    id?: string | number;
    mode?: 'create' | 'edit';
    /** Custom field renderer — overrides default FieldRenderer */
    fieldRenderer?: Snippet<[{ field: FieldDefinition; value: unknown; onchange: (v: unknown) => void }]>;
    /** Custom form action buttons */
    formActions?: Snippet<[{ isLoading: boolean; onSubmit: () => void }]>;
    /** Custom header content (after title) */
    headerContent?: Snippet;
  }

  let {
    resourceName,
    id = undefined,
    mode = 'create',
    fieldRenderer,
    formActions,
    headerContent,
  }: Props = $props();

  const resource = getResource(resourceName);
  const primaryKey = resource.primaryKey ?? 'id';

  const formFields = resource.fields.filter(f => {
    if (f.key === primaryKey) return false;
    if (f.showInForm === false) return false;
    if (mode === 'create' && f.showInCreate === false) return false;
    if (mode === 'edit' && f.showInEdit === false) return false;
    return true;
  });

  // Load existing data for edit mode
  const existingQuery = mode === 'edit' && id != null
    ? useOne({ resource: resourceName, id })
    : null;

  // Form state
  let formData = $state<Record<string, unknown>>({});
  let fieldErrors = $state<Record<string, string>>({});
  let submitting = $state(false);
  let error = $state<string | null>(null);
  let initialized = $state(false);
  let isDirty = $state(false);

  function getDefaultForType(field: FieldDefinition): unknown {
    switch (field.type) {
      case 'text': case 'textarea': case 'richtext': case 'image': return '';
      case 'number': return 0;
      case 'boolean': return false;
      case 'tags': case 'images': case 'multiselect': return [];
      case 'select': return field.options?.[0]?.value ?? '';
      case 'json': return {};
      default: return '';
    }
  }

  // Initialize form data
  $effect(() => {
    if (initialized) return;
    if (mode === 'create') {
      const defaults: Record<string, unknown> = {};
      for (const field of formFields) {
        defaults[field.key] = field.defaultValue ?? getDefaultForType(field);
      }
      formData = defaults;
      initialized = true;
    } else if (existingQuery && existingQuery.query.data?.data) {
      formData = { ...existingQuery.query.data.data as Record<string, unknown> };
      initialized = true;
    }
  });

  // Unsaved changes warning
  $effect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });

  const createMut = useCreate({ resource: resourceName });
  const updateMut = useUpdate({ resource: resourceName });

  function validateFields(): boolean {
    const errors: Record<string, string> = {};
    for (const field of formFields) {
      const value = formData[field.key];
      // Required check
      if (field.required) {
        if (value === undefined || value === null || value === '') {
          errors[field.key] = t('validation.required');
          continue;
        }
      }
      // Custom per-field validator
      if (field.validate) {
        const msg = field.validate(value);
        if (msg) { errors[field.key] = msg; }
      }
    }
    fieldErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit() {
    submitting = true;
    error = null;

    if (!validateFields()) {
      submitting = false;
      return;
    }

    try {
      const cleanData: Record<string, unknown> = {};
      for (const field of formFields) {
        const value = formData[field.key];
        if (value !== undefined) {
          cleanData[field.key] = value;
        }
      }

      if (mode === 'create') {
        await createMut.mutation.mutateAsync({ variables: cleanData });
      } else if (id != null) {
        await updateMut.mutation.mutateAsync({ id, variables: cleanData });
      }

      isDirty = false;
      navigate(`/${resourceName}`);
    } catch (e) {
      error = e instanceof Error ? e.message : t('common.operationFailed');
    } finally {
      submitting = false;
    }
  }

  function handleFieldChange(key: string, val: unknown) {
    formData[key] = val;
    isDirty = true;
    // Clear field error when user starts typing
    if (fieldErrors[key]) {
      const next = { ...fieldErrors };
      delete next[key];
      fieldErrors = next;
    }
  }

  const isLoading = $derived(mode === 'edit' && existingQuery ? existingQuery.query.isLoading : false);

  const pageTitle = $derived(
    mode === 'create'
      ? `${t('common.create')}${resource.label}`
      : `${t('common.edit')}${resource.label}`
  );
</script>

<div class="space-y-6">
  <div class="flex items-center gap-4">
    <Button
      variant="ghost" size="icon"
      onclick={() => {
        if (isDirty && !confirm(t('common.unsavedChanges'))) return;
        navigate(`/${resourceName}`);
      }}
    >
      <ArrowLeft class="h-5 w-5" />
    </Button>
    <h1 class="text-2xl font-bold text-foreground">{pageTitle}</h1>
    {#if isDirty}
      <Badge variant="outline" class="border-amber-200 bg-amber-50 text-amber-700">{t('common.unsaved')}</Badge>
    {/if}
  </div>

  {#if isLoading}
    <div class="max-w-3xl space-y-6">
      <div class="rounded-xl border p-6 space-y-5">
        {#each Array(4) as _}
          <div class="space-y-2">
            <Skeleton class="h-4 w-24" />
            <Skeleton class="h-10 w-full" />
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <form onsubmit={(e: Event) => { e.preventDefault(); handleSubmit(); }} class="max-w-3xl space-y-6">
      {#if error}
        <Alert.Root variant="destructive">
          <AlertCircle class="h-4 w-4" />
          <Alert.Description>{error}</Alert.Description>
        </Alert.Root>
      {/if}

      <Card.Root>
        <Card.Content class="space-y-5">
          {#each formFields as field (field.key)}
            <div class:border-destructive={!!fieldErrors[field.key]}>
              {#if fieldRenderer}
                {@render fieldRenderer({ field, value: formData[field.key], onchange: (val: unknown) => handleFieldChange(field.key, val) })}
              {:else}
                <FieldRenderer
                  {field}
                  value={formData[field.key]}
                  onchange={(val: unknown) => handleFieldChange(field.key, val)}
                />
              {/if}
              {#if fieldErrors[field.key]}
                <p class="text-destructive text-[0.8125rem] mt-1">{fieldErrors[field.key]}</p>
              {/if}
            </div>
          {/each}
        </Card.Content>
      </Card.Root>

      <div class="flex items-center gap-3">
        {#if formActions}
          {@render formActions({ isLoading: submitting, onSubmit: handleSubmit })}
        {:else}
          <Button type="submit" disabled={submitting}>
            {#if submitting}
              <Loader2 class="h-4 w-4 animate-spin" data-icon="inline-start" />
            {:else}
              <Save class="h-4 w-4" data-icon="inline-start" />
            {/if}
            {t('common.save')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onclick={() => {
              if (isDirty && !confirm(t('common.unsavedChanges'))) return;
              navigate(`/${resourceName}`);
            }}
          >
            {t('common.cancel')}
          </Button>
        {/if}
      </div>
    </form>
  {/if}
</div>
