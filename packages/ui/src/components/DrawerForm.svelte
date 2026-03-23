<script lang="ts">
  import { getResource } from '@svadmin/core';
  import { t } from '@svadmin/core/i18n';
  import * as Drawer from './ui/drawer/index.js';
  import AutoForm from './AutoForm.svelte';

  let { resourceName, mode = 'create', id, open = $bindable(false), side = 'right' } = $props<{
    resourceName: string;
    mode?: 'create' | 'edit';
    id?: string | number;
    open: boolean;
    side?: 'left' | 'right';
  }>();

  const resource = $derived(getResource(resourceName));
</script>

<Drawer.Root bind:open>
  <Drawer.Content>
    <Drawer.Header>
      <Drawer.Title>
        {mode === 'create' ? `${t('common.create')}${resource.label}` : `${t('common.edit')}${resource.label}`}
      </Drawer.Title>
    </Drawer.Header>
    <div class="p-4 overflow-y-auto max-h-[70vh]">
      <AutoForm {resourceName} {mode} {id} />
    </div>
  </Drawer.Content>
</Drawer.Root>
