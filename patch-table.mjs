import fs from 'fs';

let content = fs.readFileSync('packages/core/src/table-hooks.svelte.ts', 'utf8');

// Ensure reactivity type definition is available
if (!content.includes('import type { MaybeGetter }')) {
  content = content.replace("import type { UseListOptions } from './query-hooks.svelte';", "import type { UseListOptions, MaybeGetter } from './query-hooks.svelte';");
}


// ─── useTable Replace ───
const oldUseTable = `export function useTable<
  TQueryFnData extends BaseRecord = BaseRecord,
  TError = HttpError,
  TSearchVariables = Record<string, unknown>
>(options: UseTableOptions<TQueryFnData, TError, TSearchVariables> = {}) {
  const parsed = useParsed();
  const resource = options.resource ?? parsed.resource ?? '';
  const { meta, syncWithLocation = false, dataProviderName, pagination: _p, sorters: _s, filters: _f, ...restOptions } = options;
  
  const paginationMode = options.pagination?.mode ?? 'server';
  const sortersMode = options.sorters?.mode ?? 'server';
  const filtersMode = options.filters?.mode ?? 'server';
  const filterDefaultBehavior = options.filters?.defaultBehavior ?? 'replace';

  const permanentSorters = options.sorters?.permanent ?? [];
  const permanentFilters = options.filters?.permanent ?? [];

  let initPagination = options.pagination ?? { current: 1, pageSize: 10 };
  let initSorters = options.sorters?.initial ?? [];
  let initFilters = options.filters?.initial ?? [];

  if (syncWithLocation && typeof window !== 'undefined') {
    const urlState = readURLState();
    if (urlState.page || urlState.pageSize) {
      initPagination = {
        current: urlState.page ?? initPagination.current,
        pageSize: urlState.pageSize ?? initPagination.pageSize,
      };
    }
    if (urlState.sortField) {
      initSorters = [{ field: urlState.sortField, order: (urlState.sortOrder as 'asc' | 'desc') ?? 'asc' }];
    }
    if (urlState.filters) {
      initFilters = urlState.filters;
    }
  }

  let pagination = $state<Pagination>(initPagination);
  let currentSorters = $state<Sort[]>(initSorters);
  let currentFilters = $state<Filter[]>(initFilters);

  const effectiveSorters = $derived([...currentSorters, ...permanentSorters]);
  const effectiveFilters = $derived([...currentFilters, ...permanentFilters]);

  const querySorters = $derived(sortersMode === 'server' ? effectiveSorters : []);
  const queryFilters = $derived(filtersMode === 'server' ? effectiveFilters : []);
  const queryPagination = $derived(paginationMode === 'server'
    ? pagination
    : { current: 1, pageSize: 999999, mode: paginationMode as 'client' | 'off' });

  const tableQueryInfo = useList<TQueryFnData, TError>({
    resource,
    get pagination() { return queryPagination; },
    get sorters() { return querySorters; },
    get filters() { return queryFilters; },
    meta,
    dataProviderName,
    ...restOptions
  });`;

const newUseTable = `export function useTable<
  TQueryFnData extends BaseRecord = BaseRecord,
  TError = HttpError,
  TSearchVariables = Record<string, unknown>
>(optionsOrGetter: MaybeGetter<UseTableOptions<TQueryFnData, TError, TSearchVariables>> = {}) {
  const getOptions = () => typeof optionsOrGetter === 'function' ? optionsOrGetter() : optionsOrGetter;
  const parsed = useParsed();
  
  // Use a local derived to compute these since they are used to initialize state
  // Even if options change, init values are only used once, which makes sense for initial state
  const initialOpts = getOptions();
  
  const paginationMode = $derived(getOptions().pagination?.mode ?? 'server');
  const sortersMode = $derived(getOptions().sorters?.mode ?? 'server');
  const filtersMode = $derived(getOptions().filters?.mode ?? 'server');
  const filterDefaultBehavior = $derived(getOptions().filters?.defaultBehavior ?? 'replace');

  const permanentSorters = $derived(getOptions().sorters?.permanent ?? []);
  const permanentFilters = $derived(getOptions().filters?.permanent ?? []);

  let initPagination = initialOpts.pagination ?? { current: 1, pageSize: 10 };
  let initSorters = initialOpts.sorters?.initial ?? [];
  let initFilters = initialOpts.filters?.initial ?? [];

  if (initialOpts.syncWithLocation && typeof window !== 'undefined') {
    const urlState = readURLState();
    if (urlState.page || urlState.pageSize) {
      initPagination = {
        current: urlState.page ?? initPagination.current,
        pageSize: urlState.pageSize ?? initPagination.pageSize,
      };
    }
    if (urlState.sortField) {
      initSorters = [{ field: urlState.sortField, order: (urlState.sortOrder as 'asc' | 'desc') ?? 'asc' }];
    }
    if (urlState.filters) {
      initFilters = urlState.filters;
    }
  }

  let pagination = $state<Pagination>(initPagination);
  let currentSorters = $state<Sort[]>(initSorters);
  let currentFilters = $state<Filter[]>(initFilters);

  const effectiveSorters = $derived([...currentSorters, ...permanentSorters]);
  const effectiveFilters = $derived([...currentFilters, ...permanentFilters]);

  const querySorters = $derived(sortersMode === 'server' ? effectiveSorters : []);
  const queryFilters = $derived(filtersMode === 'server' ? effectiveFilters : []);
  const queryPagination = $derived(paginationMode === 'server'
    ? pagination
    : { current: 1, pageSize: 999999, mode: paginationMode as 'client' | 'off' });

  const tableQueryInfo = useList<TQueryFnData, TError>(() => {
    const currentOpts = getOptions();
    const { meta, syncWithLocation, dataProviderName, pagination: _p, sorters: _s, filters: _f, ...restOptions } = currentOpts;
    return {
      resource: currentOpts.resource ?? parsed.resource ?? '',
      pagination: queryPagination,
      sorters: querySorters,
      filters: queryFilters,
      meta,
      dataProviderName,
      ...restOptions
    };
  });`;

content = content.replace(oldUseTable, newUseTable);

// We must also fix reference to filterDefaultBehavior
content = content.replace('const behavior = mode ?? filterDefaultBehavior;', 'const behavior = mode ?? filterDefaultBehavior;');

fs.writeFileSync('packages/core/src/table-hooks.svelte.ts', content);

