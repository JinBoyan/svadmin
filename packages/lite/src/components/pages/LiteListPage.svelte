<script lang="ts">
  import type { ResourceDefinition } from '@svadmin/core';
  import { t } from '@svadmin/core/i18n';
  import LiteTable from '../LiteTable.svelte';
  import LitePagination from '../LitePagination.svelte';
  import LiteSearch from '../LiteSearch.svelte';
  import LiteCreateButton from '../buttons/LiteCreateButton.svelte';
  import LiteRefreshButton from '../buttons/LiteRefreshButton.svelte';

  interface Props {
    resource: ResourceDefinition;
    records: Record<string, unknown>[];
    total: number;
    pagination: { page: number; perPage: number };
    currentSort?: string;
    currentOrder?: 'asc' | 'desc';
    currentSearch?: string;
    basePath?: string;
    canCreate?: boolean;
    canEdit?: boolean;
    canDelete?: boolean;
  }

  let {
    resource,
    records,
    total,
    pagination,
    currentSort,
    currentOrder = 'asc',
    currentSearch,
    basePath = '/lite',
    canCreate = true,
    canEdit = true,
    canDelete = true,
  }: Props = $props();
</script>

<div class="lite-page">
  <div class="lite-page-header">
    <h1 class="lite-page-title">{resource.label || resource.name} {t('common.list') || 'List'}</h1>
    <div class="lite-page-actions">
      {#if canCreate}
        <LiteCreateButton resource={resource.name} {basePath} />
      {/if}
      <LiteRefreshButton hideText />
    </div>
  </div>

  <div class="lite-card" style="margin-bottom: 20px;">
    <div style="padding: 16px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
      <LiteSearch value={currentSearch} placeholder={t('common.search') || 'Search...'} />
      <span style="font-size: 13px; color: #64748b;">
        {t('common.total') || 'Total'}: {total}
      </span>
    </div>

    <LiteTable
      {records}
      {resource}
      {currentSort}
      {currentOrder}
      {currentSearch}
      {basePath}
      {canEdit}
      {canDelete}
    />
    
    {#if total > pagination.perPage}
      <LitePagination
        page={pagination.page}
        totalPages={Math.ceil(total / pagination.perPage)}
        preserveParams={{
          ...(currentSort ? { sort: currentSort } : {}),
          ...(currentOrder ? { order: currentOrder } : {}),
          ...(currentSearch ? { q: currentSearch } : {})
        }}
      />
    {/if}
  </div>
</div>
